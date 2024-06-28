$(document).ready(function() {
    loadForm();

    $('#submitRow').click(function() {
        const newRow = {};
        $('#addRowForm').serializeArray().forEach(input => {
            newRow[input.name] = input.value;
        });
        addRowToExcel(newRow);
    });
});

function loadForm() {
    $.ajax({
        url: '/data',
        method: 'GET',
        success: function(response) {
            data = response;
            let columns = [];
            if (data.length > 0) {
                columns = Object.keys(data[0]).map(key => ({
                    title: key,
                    data: key,
                    defaultContent: ''
                }));
            }
            populateForm(columns, data);
        }
    });
}

function populateForm(columns, data) {
    $('#addRowForm').empty();
    const classificationOptions = ["IT","RAČUNALNIK","OSEBNI RAČUNALNIK","PRENOSNI RAČUNALNIK","TABLIČNI","TERMINAL","SERVER","ALL IN ONE","MONITOR","PROJEKTOR","TISKALNIK","MULTIFUNKCIJSKA NAPRAVA","SCANNER","SWITCH","UPS","ACCESS POINT","TV","MPC","OFFICE365","DISKOVNO POLJE","BT NAPRAVE"];
    const statusOptions = ["OPERATING", "BROKEN", "NOT READY", "Poslano v Makedonijo", "DECOMMISSIONED"];
    const ownershipOptions = ["TAB","MPI","IPM","PP","GM"];

    const descriptionOptions = [...new Set(data.map(row => row["Opis"]))];

    columns.forEach(col => {
        if (col.data !== null) {
            let inputField;
            switch (col.data) {
                case "Klasifikacija sredstva":
                    inputField = `
                        <input list="classificationOptions" class="form-control" name="${col.data}" placeholder="${col.title}">
                        <datalist id="classificationOptions">
                            ${classificationOptions.map(option => `<option value="${option}">`).join('')}
                        </datalist>`;
                    break;
                case "Status":
                    inputField = `
                        <input list="statusOptions" class="form-control" name="${col.data}" placeholder="${col.title}">
                        <datalist id="statusOptions">
                            ${statusOptions.map(option => `<option value="${option}">`).join('')}
                        </datalist>`;
                    break;
                case "Lastništvo OS":
                    inputField = `
                        <input list="ownershipOptions" class="form-control" name="${col.data}" placeholder="${col.title}">
                        <datalist id="ownershipOptions">
                            ${ownershipOptions.map(option => `<option value="${option}">`).join('')}
                        </datalist>`;
                    break;
                case "Opis":
                    inputField = `<input type="text" class="form-control" id="opisInput" name="${col.data}" placeholder="${col.title}"/>`;
                    break;
                default:
                    inputField = `<input type="text" class="form-control" name="${col.data}" placeholder="${col.title}"/>`;
            }
            $('#addRowForm').append(`<div class="form-group">${inputField}</div>`);
        }
    });

    $("#opisInput").autocomplete({
        source: descriptionOptions
    });
}

function addRowToExcel(newRow) {
    $.ajax({
        url: '/data',
        method: 'GET',
        success: function(response) {
            const data = response;
            data.push(newRow);
            $.ajax({
                url: '/data',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function() {
                    alert('Row added successfully!');
                    window.location.href = 'index.html';
                }
            });
        }
    });
}
