const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Ensure temp_reports directory exists
const reportsDir = path.join(__dirname, '../../temp_reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Background cleanup: Delete PDFs older than 1 hour
setInterval(() => {
    fs.readdir(reportsDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            if (!file.endsWith('.pdf')) return;
            const filePath = path.join(reportsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                // 1 hour = 60 * 60 * 1000 ms
                if (now - stats.mtimeMs > 3600000) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}, 3600000); // Check every hour

const axios = require('axios');

const generatePdfReport = async (topic, timeframe, data, companyName = 'Inventory System', warehouseName = 'Main Branch', logoInput = null) => {
    return new Promise(async (resolve, reject) => {
        const filename = `report_${Date.now()}.pdf`;
        const filePath = path.join(reportsDir, filename);

        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // --- Header Section with Logo and Company Name ---
        
        let logoDrawn = false;
        
        if (logoInput) {
            try {
                if (logoInput.startsWith('data:image')) {
                    const base64Data = logoInput.split(',')[1];
                    const imgBuffer = Buffer.from(base64Data, 'base64');
                    doc.image(imgBuffer, 50, 40, { fit: [35, 35], align: 'center', valign: 'center' });
                    logoDrawn = true;
                } else if (logoInput.startsWith('http')) {
                    const response = await axios.get(logoInput, { responseType: 'arraybuffer' });
                    const imgBuffer = Buffer.from(response.data, 'binary');
                    doc.image(imgBuffer, 50, 40, { fit: [35, 35], align: 'center', valign: 'center' });
                    logoDrawn = true;
                }
            } catch (err) {
                console.error('Error drawing logo in PDF:', err.message);
            }
        }

        if (!logoDrawn) {
            // Professional Lettermark Fallback Logo
            const initials = companyName.substring(0, 2).toUpperCase();
            doc.circle(65, 55, 18).fill('#4F46E5');
            
            // Adjust text position slightly based on 1 or 2 letters
            const textX = initials.length === 1 ? 59 : 54;
            doc.fillColor('#FFFFFF')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(initials, textX, 49);
        }

        // Company Name
        doc.fillColor('#1E293B')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text(companyName, 95, 44);

        // Warehouse Name
        doc.fillColor('#64748B')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(warehouseName, 95, 66);

        // Date and Time generated
        doc.fontSize(10)
           .text(`Date Generated: ${new Date().toLocaleDateString()}`, 0, 50, { align: 'right' });

        doc.moveDown(3);

        // Horizontal Line
        doc.moveTo(50, 110).lineTo(550, 110).lineWidth(1).strokeColor('#E2E8F0').stroke();
        doc.moveDown(2);

        // --- Report Title ---
        doc.fillColor('#0F172A')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(`${topic} Report`, { align: 'center' });
        
        doc.fillColor('#64748B')
           .fontSize(12)
           .font('Helvetica')
           .text(`Timeframe: ${timeframe}`, { align: 'center' });
        
        doc.moveDown(2);

        // --- Report Content (Dynamic based on topic) ---
        doc.fillColor('#1E293B').fontSize(12);

        if (topic === 'Sales') {
            doc.font('Helvetica-Bold').text('Sales Summary', { underline: true });
            doc.font('Helvetica').moveDown(0.5);
            doc.text(`Total Orders: ${data.count}`);
            doc.text(`Total Revenue: $${data.revenue.toFixed(2)}`);
            doc.moveDown();

            if (data.topItems && data.topItems.length > 0) {
                doc.font('Helvetica-Bold').text('Top Selling Items:');
                doc.font('Helvetica').moveDown(0.5);
                data.topItems.forEach((item, index) => {
                    doc.text(`${index + 1}. ${item._id} - ${item.totalQuantitySold} units ($${item.totalRevenue.toFixed(2)})`);
                });
            }
        } 
        else if (topic === 'Purchases') {
            doc.font('Helvetica-Bold').text('Purchases Summary', { underline: true });
            doc.font('Helvetica').moveDown(0.5);
            doc.text(`Total Purchase Orders: ${data.count}`);
            doc.text(`Total Expenditure: $${data.totalCost.toFixed(2)}`);
        }
        else if (topic === 'Inventory' || topic === 'Stock') {
            doc.font('Helvetica-Bold').text('Inventory Status', { underline: true });
            doc.font('Helvetica').moveDown(0.5);
            doc.text(`Total Unique Products: ${data.total}`);
            doc.text(`Products Expiring Soon (30 days): ${data.expiring}`);
            doc.moveDown();
            
            doc.font('Helvetica-Bold').text(`Low Stock Alerts (${data.lowCount}):`);
            doc.font('Helvetica').moveDown(0.5);
            if (data.lowStock && data.lowStock.length > 0) {
                data.lowStock.forEach(p => {
                    doc.text(`- ${p.name}: ${p.quantity} units remaining (Reorder Level: ${p.reorderLevel})`);
                });
            } else {
                doc.text('No low stock alerts at this time.');
            }
        }
        else { // Summary
            doc.font('Helvetica-Bold').text('Business Summary', { underline: true });
            doc.font('Helvetica').moveDown(0.5);
            
            doc.text(`Sales Orders: ${data.sales.count} | Revenue: $${data.sales.revenue.toFixed(2)}`);
            doc.text(`Purchases: ${data.purchases.count} | Expenditure: $${data.purchases.totalCost.toFixed(2)}`);
            doc.moveDown();
            doc.text(`Active Staff: ${data.people.staff}`);
            doc.text(`Active Vendors: ${data.people.vendors}`);
            doc.text(`Active Customers: ${data.people.customers}`);
            doc.moveDown();
            doc.text(`Total Products: ${data.inventory.total}`);
            doc.text(`Low Stock Alerts: ${data.inventory.lowCount}`);
            doc.text(`Expiring Soon: ${data.inventory.expiring}`);
        }

        // --- Footer ---
        doc.moveDown(4);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#E2E8F0').stroke();
        doc.moveDown();
        doc.fillColor('#94A3B8').fontSize(9).text('Generated by AI Inventory Assistant', { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
            resolve({ filename, filePath });
        });

        writeStream.on('error', (error) => {
            reject(error);
        });
    });
};

module.exports = { generatePdfReport };
