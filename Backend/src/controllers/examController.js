const asyncHandler = require('../middleware/asyncHandler');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');

// ---- Grading ---------------------------------------------------------------

// Standard percentage → letter grade + grade point.
const gradeFor = (pct) => {
    if (pct >= 90) return { grade: 'A+', point: 4.0 };
    if (pct >= 80) return { grade: 'A', point: 3.7 };
    if (pct >= 70) return { grade: 'B', point: 3.0 };
    if (pct >= 60) return { grade: 'C', point: 2.0 };
    if (pct >= 50) return { grade: 'D', point: 1.0 };
    return { grade: 'F', point: 0.0 };
};

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

// Merge an exam's subjects, the class students, and any saved marks into a
// ranked result sheet with totals, percentage, grade and pass/fail per student.
const buildResultSheet = (exam, students, resultDocs) => {
    const byStudent = new Map();
    resultDocs.forEach((r) => byStudent.set(String(r.studentId), r));

    const subjects = exam.subjects || [];
    const totalFull = subjects.reduce((sum, s) => sum + Number(s.fullMarks || 0), 0);

    const rows = students.map((s) => {
        const doc = byStudent.get(String(s._id));
        const marksMap = new Map();
        (doc?.marks || []).forEach((m) => marksMap.set(m.subject, m));
        const entered = !!doc && (doc.marks || []).length > 0;

        let totalObtained = 0;
        let failedSubjects = 0;
        const subjectResults = subjects.map((sub) => {
            const m = marksMap.get(sub.name);
            const isAbsent = !!m?.isAbsent;
            const obtained = isAbsent ? 0 : Number(m?.marksObtained || 0);
            const passed = !isAbsent && obtained >= Number(sub.passMarks || 0);
            if (entered && !passed) failedSubjects += 1;
            totalObtained += obtained;
            return {
                subject: sub.name,
                fullMarks: Number(sub.fullMarks || 0),
                passMarks: Number(sub.passMarks || 0),
                marksObtained: obtained,
                isAbsent,
                passed
            };
        });

        const percentage = totalFull > 0 ? round1((totalObtained / totalFull) * 100) : 0;
        const { grade, point } = gradeFor(percentage);

        return {
            studentId: s._id,
            studentName: s.fullName,
            rollNumber: s.rollNumber || s.studentCode || '',
            entered,
            subjects: subjectResults,
            totalObtained,
            totalFull,
            percentage,
            grade: entered ? grade : '-',
            point: entered ? point : 0,
            status: entered ? (failedSubjects > 0 ? 'Fail' : 'Pass') : 'Pending',
            failedSubjects,
            remarks: doc?.remarks || ''
        };
    });

    // Rank only students whose marks were entered, by total obtained (desc).
    const ranked = rows
        .filter((r) => r.entered)
        .sort((a, b) => b.totalObtained - a.totalObtained);
    let lastScore = null;
    let lastRank = 0;
    ranked.forEach((r, i) => {
        if (r.totalObtained === lastScore) {
            r.position = lastRank; // tie → same rank
        } else {
            r.position = i + 1;
            lastRank = i + 1;
            lastScore = r.totalObtained;
        }
    });
    rows.forEach((r) => { if (r.position === undefined) r.position = null; });

    // Class summary.
    const gradedRows = rows.filter((r) => r.entered);
    const passed = gradedRows.filter((r) => r.status === 'Pass').length;
    const failed = gradedRows.filter((r) => r.status === 'Fail').length;
    const avgPercentage = gradedRows.length
        ? round1(gradedRows.reduce((sum, r) => sum + r.percentage, 0) / gradedRows.length)
        : 0;
    const topper = ranked[0] || null;

    const summary = {
        totalStudents: rows.length,
        graded: gradedRows.length,
        pending: rows.length - gradedRows.length,
        passed,
        failed,
        passRate: gradedRows.length ? round1((passed / gradedRows.length) * 100) : 0,
        avgPercentage,
        topper: topper ? { studentName: topper.studentName, percentage: topper.percentage } : null,
        totalFull
    };

    return { rows, summary };
};

const classStudents = (classId) =>
    Student.find({ classId, status: { $ne: 'Graduated' } })
        .select('fullName rollNumber studentCode classId')
        .sort({ fullName: 1 })
        .lean();

// ---- Exam CRUD -------------------------------------------------------------

const getExams = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.status) filter.status = req.query.status;

    const exams = await Exam.find(filter)
        .populate('classId', 'name className')
        .sort({ examDate: -1, createdAt: -1 })
        .lean();

    // Attach a quick "results entered" count per exam.
    const counts = await ExamResult.aggregate([
        { $group: { _id: '$examId', n: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    exams.forEach((e) => { e.resultsCount = countMap.get(String(e._id)) || 0; });

    res.json(exams);
});

const getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate('classId', 'name className');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    res.json(exam);
});

const createExam = asyncHandler(async (req, res) => {
    const payload = { ...req.body, createdBy: req.user?._id };
    if (!payload.branchId && req.user?.branchId) payload.branchId = req.user.branchId;
    if (!payload.title || !payload.classId) {
        res.status(400);
        throw new Error('Exam title and class are required');
    }
    if (!Array.isArray(payload.subjects) || payload.subjects.length === 0) {
        res.status(400);
        throw new Error('Add at least one subject to the exam');
    }
    const exam = await Exam.create(payload);
    const populated = await Exam.findById(exam._id).populate('classId', 'name className');
    res.status(201).json(populated);
});

const updateExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        .populate('classId', 'name className');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    res.json(exam);
});

const deleteExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    // Clean up all results tied to this exam.
    await ExamResult.deleteMany({ examId: exam._id });
    res.json({ message: 'Exam and its results removed' });
});

// ---- Results ---------------------------------------------------------------

// Full ranked result sheet for an exam (all class students + their marks).
const getExamResults = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate('classId', 'name className');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    const [students, resultDocs] = await Promise.all([
        classStudents(exam.classId._id || exam.classId),
        ExamResult.find({ examId: exam._id }).lean()
    ]);
    const { rows, summary } = buildResultSheet(exam, students, resultDocs);
    res.json({ exam, results: rows, summary });
});

// Save / update marks for many students at once (mark entry grid).
const saveExamResults = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    const results = Array.isArray(req.body?.results) ? req.body.results : [];
    if (!results.length) {
        res.status(400);
        throw new Error('No marks provided');
    }

    const validSubjects = new Set((exam.subjects || []).map((s) => s.name));
    let saved = 0;
    for (const r of results) {
        if (!r.studentId) continue;
        const marks = (Array.isArray(r.marks) ? r.marks : [])
            .filter((m) => validSubjects.has(m.subject))
            .map((m) => ({
                subject: m.subject,
                marksObtained: Math.max(0, Number(m.marksObtained) || 0),
                isAbsent: !!m.isAbsent
            }));
        await ExamResult.findOneAndUpdate(
            { examId: exam._id, studentId: r.studentId },
            {
                examId: exam._id,
                studentId: r.studentId,
                classId: exam.classId,
                marks,
                remarks: r.remarks || '',
                createdBy: req.user?._id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved += 1;
    }

    // Once marks exist the exam is at least "Completed" (unless already published).
    if (exam.status === 'Scheduled' || exam.status === 'Ongoing') {
        exam.status = 'Completed';
        await exam.save();
    }

    res.json({ message: `Saved marks for ${saved} student(s)`, saved, status: exam.status });
});

// One student's report card, including their rank in the class.
const getStudentResult = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).populate('classId', 'name className');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    const [students, resultDocs] = await Promise.all([
        classStudents(exam.classId._id || exam.classId),
        ExamResult.find({ examId: exam._id }).lean()
    ]);
    const { rows, summary } = buildResultSheet(exam, students, resultDocs);
    const row = rows.find((r) => String(r.studentId) === String(req.params.studentId));
    if (!row) {
        res.status(404);
        throw new Error('Student is not part of this exam class');
    }
    res.json({ exam, result: row, classSize: summary.graded, summary });
});

const publishExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }
    exam.status = req.body?.status === 'Completed' ? 'Completed' : 'Published';
    await exam.save();
    const populated = await Exam.findById(exam._id).populate('classId', 'name className');
    res.json(populated);
});

module.exports = {
    getExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    getExamResults,
    saveExamResults,
    getStudentResult,
    publishExam
};
