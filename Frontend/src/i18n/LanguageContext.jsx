import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard', academicManagement: 'Academic Management', classes: 'Classes', teachers: 'Teachers', students: 'Students', classPromotion: 'Class Promotion', attendance: 'Attendance', studentAttendance: 'Student Attendance', teacherAttendance: 'Teacher Attendance', examinations: 'Examinations', exams: 'Exams', markEntry: 'Mark Entry', results: 'Results', finance: 'Finance', cashbook: 'Cashbook', payers: 'Payers', wallets: 'Wallets', instituteStructure: 'Institute Structure', branches: 'Branches', reports: 'Reports', feePaymentReport: 'Fee Payment Report', categorySummaryReport: 'Category Summary Report', paymentReport: 'Payment Report', attendanceLedger: 'Attendance Ledger', usersAccess: 'Users & Access', users: 'Users', rolesPermissions: 'Roles & Permissions', logs: 'Logs', settings: 'Settings', search: 'Search anything...', notifications: 'Notifications', profile: 'Profile', changePassword: 'Change Password', logout: 'Logout', systemLanguage: 'System language', english: 'English', somali: 'Somali', languageSaved: 'Language saved. The interface has been updated.', languageDescription: 'Choose the language used across the application.', systemPreferences: 'System Preferences', saveLanguage: 'Save language', instituteManagement: 'Institute Management', signedInAs: 'Signed in as', openMenu: 'Open menu', toggleDarkMode: 'Toggle dark mode', allTextNote: 'New and shared interface text changes immediately. Additional page text is translated as each page adopts these language keys.'
  },
  so: {
    dashboard: 'Guddi-hagid', academicManagement: 'Maamulka Waxbarashada', classes: 'Fasallada', teachers: 'Macallimiinta', students: 'Ardayda', classPromotion: 'Dalacsiinta Fasalka', attendance: 'Xaadirinta', studentAttendance: 'Xaadirinta Ardayda', teacherAttendance: 'Xaadirinta Macallimiinta', examinations: 'Imtixaannada', exams: 'Imtixaanno', markEntry: 'Gelinta Dhibcaha', results: 'Natiijooyinka', finance: 'Maaliyadda', cashbook: 'Buugga Lacagta', payers: 'Bixiyeyaasha', wallets: 'Jeebabka', instituteStructure: 'Qaab-dhismeedka Machadka', branches: 'Laamaha', reports: 'Warbixinnada', feePaymentReport: 'Warbixinta Lacag-bixinta', categorySummaryReport: 'Warbixinta Qaybaha', paymentReport: 'Warbixinta Bixinta', attendanceLedger: 'Diiwaanka Xaadirinta', usersAccess: 'Isticmaaleyaasha & Gelitaanka', users: 'Isticmaaleyaasha', rolesPermissions: 'Doorarka & Oggolaanshaha', logs: 'Diiwaannada', settings: 'Dejinta', search: 'Raadi wax kasta...', notifications: 'Ogeysiisyada', profile: 'Astaanta', changePassword: 'Beddel Furaha Sirta', logout: 'Ka bax', systemLanguage: 'Luqadda nidaamka', english: 'Ingiriisi', somali: 'Soomaali', languageSaved: 'Luqadda waa la kaydiyey. Isku-xirka waa la cusboonaysiiyey.', languageDescription: 'Dooro luqadda laga isticmaalo dhammaan barnaamijka.', systemPreferences: 'Doorbidyada Nidaamka', saveLanguage: 'Kaydi luqadda', instituteManagement: 'Maamulka Machadka', signedInAs: 'Waxaad ku gashay', openMenu: 'Fur liiska', toggleDarkMode: 'Beddel habka mugdiga', allTextNote: 'Qoraalka cusub iyo kan wadaagga ah isla markiiba wuu isbeddelayaa. Qoraalka bogagga kale waa la turjumayaa marka bog walba lagu xiro furayaashan luqadeed.'
  },
  ar: {
    dashboard: 'لوحة التحكم', academicManagement: 'الإدارة الأكاديمية', classes: 'الفصول', teachers: 'المعلمون', students: 'الطلاب', classPromotion: 'ترقية الفصل', attendance: 'الحضور', studentAttendance: 'حضور الطلاب', teacherAttendance: 'حضور المعلمين', examinations: 'الامتحانات', exams: 'الاختبارات', markEntry: 'إدخال الدرجات', results: 'النتائج', finance: 'المالية', cashbook: 'دفتر النقدية', payers: 'الدافعون', wallets: 'المحافظ', instituteStructure: 'هيكل المعهد', branches: 'الفروع', reports: 'التقارير', feePaymentReport: 'تقرير دفع الرسوم', categorySummaryReport: 'تقرير ملخص الفئات', paymentReport: 'تقرير الدفع', attendanceLedger: 'سجل الحضور', usersAccess: 'المستخدمون والصلاحيات', users: 'المستخدمون', rolesPermissions: 'الأدوار والصلاحيات', logs: 'السجلات', settings: 'الإعدادات', search: 'ابحث عن أي شيء...', notifications: 'الإشعارات', profile: 'الملف الشخصي', changePassword: 'تغيير كلمة المرور', logout: 'تسجيل الخروج', systemLanguage: 'لغة النظام', english: 'الإنجليزية', somali: 'الصومالية', arabic: 'العربية', languageSaved: 'تم حفظ اللغة وتحديث الواجهة.', languageDescription: 'اختر اللغة المستخدمة في التطبيق.', systemPreferences: 'تفضيلات النظام', saveLanguage: 'حفظ الإعدادات', instituteManagement: 'إدارة المعهد', signedInAs: 'تم تسجيل الدخول باسم', openMenu: 'فتح القائمة', toggleDarkMode: 'تبديل الوضع الداكن', allTextNote: 'يتم تحديث النصوص المشتركة فوراً. تُترجم بقية الصفحات عند ربطها بمفاتيح اللغة.'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('appLanguage') || 'en');
  const setLanguage = (value) => setLanguageState(['en', 'so', 'ar'].includes(value) ? value : 'en');

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: (key) => translations[language][key] || translations.en[key] || key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
