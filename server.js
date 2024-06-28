const express = require('express');
const app = express();
const xlsx = require('xlsx');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Nastavite večjo velikost telesa zahteve
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const excelFile = 'podatki.xlsx';

function readExcel() {
    if (fs.existsSync(excelFile)) {
        const workbook = xlsx.readFile(excelFile);
        const sheet_name_list = workbook.SheetNames;
        const sheet = workbook.Sheets[sheet_name_list[0]];
        return xlsx.utils.sheet_to_json(sheet, { defval: "" });
    } else {
        return [];
    }
}

function writeExcel(data) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    xlsx.writeFile(workbook, excelFile);
}

app.get('/data', (req, res) => {
    const data = readExcel();
    res.json(data);
});

app.post('/data', (req, res) => {
    const newData = req.body;
    writeExcel(newData);
    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
