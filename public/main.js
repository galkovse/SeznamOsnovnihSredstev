let table;
let data;
let refreshInterval;
let isSearching = false;

$(document).ready(function() {
    loadData();

    $('#saveChanges').click(function() {
        const updatedData = table.data().toArray().map((row, index) => {
            delete row['#'];
            return row;
        });
        $.ajax({
            url: '/data',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function() {
                alert('Podatki uspešno shranjeni!');
                loadData(); // Osveži podatke po shranjevanju
            }
        });
    });

    $('#refreshTable').click(function() {
        loadData();
    });

    $('#startScan').click(function() {
        startQrScanner();
    });

    // Redno osveževanje podatkov
    refreshInterval = setInterval(loadData, 30000); // Osveži podatke vsakih 30 sekund

    $('#excelTable_filter input').on('input', function() {
        if ($(this).val() === '') {
            $('#qr-result').text('No QR code scanned yet');
            isSearching = false;
            refreshInterval = setInterval(loadData, 30000); // Ponovno omogočimo osveževanje, če ni več iskanja
        } else {
            clearInterval(refreshInterval); // Ustavimo osveževanje med iskanjem
            isSearching = true;
        }
    });

    $('#excelTable tbody').on('dblclick', 'tr', function() {
        const row = table.row(this).data();
        const rowIndex = table.row(this).index();
        editRowInPlace(this, row, rowIndex);
    });
});

function loadData() {
    if (isSearching) return; // Prepreči osveževanje med iskanjem
    $.ajax({
        url: '/data',
        method: 'GET',
        success: function(response) {
            data = response;
            initializeTable(data);
        },
        error: function(error) {
            console.error("Napaka pri nalaganju podatkov:", error);
        }
    });
}

function initializeTable(data) {
    let columns = [];
    if (data.length > 0) {
        columns = Object.keys(data[0]).map(key => ({
            title: key,
            data: key,
            defaultContent: ''
        }));
    }

    // Dodaj stolpec za številke vrstic
    columns.unshift({ title: '#', data: null, defaultContent: '', render: (data, type, row, meta) => meta.row + 1 });

    if (table) {
        table.clear().destroy();
        $('#excelTable thead').empty();
    }

    table = $('#excelTable').DataTable({
        data: data,
        columns: columns,
        paging: true, // Omogoči paginacijo
        searching: true, // Omogoči iskanje
        info: true, // Prikaži informacije
        autoWidth: false, // Onemogoči samodejno širino
        responsive: true, // Omogoči responsive design
        order: [[1, 'asc']], // Uredi po prvem stolpcu (številke vrstic)
        language: {
            search: "Išči:" // Spremeni besedilo iskalne vrstice
        }
    });

    table.on('order.dt search.dt', function() {
        table.column(0, { search: 'applied', order: 'applied' }).nodes().each(function(cell, i) {
            cell.innerHTML = i + 1;
        });

        highlightSearch();
    }).draw();

    table.on('search.dt', function() {
        highlightSearch();
    });
}

function highlightSearch() {
    const searchValue = table.search();
    if (searchValue) {
        $('#excelTable tbody tr').each(function() {
            const row = $(this);
            row.find('td').each(function() {
                const cell = $(this);
                const cellText = cell.text();
                const regex = new RegExp(`(${searchValue})`, 'gi');
                const highlightedText = cellText.replace(regex, '<span class="highlight">$1</span>');
                cell.html(highlightedText);
            });
        });
    } else {
        removeHighlights();
    }
}

function removeHighlights() {
    $('#excelTable tbody tr').each(function() {
        const row = $(this);
        row.find('td').each(function() {
            const cell = $(this);
            const cellText = cell.text();
            cell.html(cellText);
        });
    });
}

function editRowInPlace(rowElement, rowData, rowIndex) {
    $(rowElement).children('td').each(function(index) {
        if (index !== 0) { // Ne spreminjaj prvega stolpca (številka vrstice)
            const key = table.column(index).dataSrc();
            const value = rowData[key];
            $(this).html(`<input type="text" class="form-control" value="${value}"/>`);
        }
    });
    const saveButton = $('<button class="btn btn-success mt-2">Shrani spremembe</button>');
    const deleteButton = $('<button class="btn btn-danger mt-2 ml-2">Briši celo vrstico</button>');

    const actionButtonsRow = $('<tr><td colspan="' + $(rowElement).children('td').length + '"></td></tr>');
    actionButtonsRow.find('td').append(saveButton).append(deleteButton);
    $(rowElement).after(actionButtonsRow);

    saveButton.click(function() {
        const updatedRow = {};
        $(rowElement).children('td').each(function(index) {
            if (index !== 0) { // Ne spreminjaj prvega stolpca (številka vrstice)
                const key = table.column(index).dataSrc();
                const value = $(this).find('input').val();
                updatedRow[key] = value;
                $(this).html(value);
            } else {
                $(this).html(rowIndex + 1);
            }
        });

        // Posodobi vrstico v DataTable
        table.row(rowIndex).data($.extend({}, rowData, updatedRow)).draw();
        
        // Pošlji posodobljene podatke na strežnik
        saveUpdatedData();

        actionButtonsRow.remove();
    });

    deleteButton.click(function() {
        // Prikaži potrditveno pogovorno okno
        const confirmDelete = confirm("Ali ste prepričani, da želite izbrisati to vrstico?");
        if (confirmDelete) {
            // Odstrani vrstico iz DataTable
            table.row(rowIndex).remove().draw();
            
            // Pošlji posodobljene podatke na strežnik
            saveUpdatedData();

            actionButtonsRow.remove();
        }
    });
}

function saveUpdatedData() {
    const updatedData = table.data().toArray().map((row, index) => {
        delete row['#'];
        return row;
    });

    $.ajax({
        url: '/data',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        success: function() {
            alert('Podatki uspešno shranjeni!');
        },
        error: function(error) {
            console.error("Napaka pri shranjevanju podatkov:", error);
        }
    });
}

function startQrScanner() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: 250
                    },
                    qrCodeMessage => {
                        clearInterval(refreshInterval); // Ustavimo osveževanje med skeniranjem
                        $('#qr-result').text(`QR Code: ${qrCodeMessage}`);
                        table.search(qrCodeMessage).draw();
                        highlightRowByCode(qrCodeMessage);
                        alert('Uspešno skenirano! Potrdite, da vidite podatek v tabeli.');
                        html5QrCode.stop().then(() => {
                            console.log("Skeniranje QR kode je ustavljeno.");
                            refreshInterval = setInterval(loadData, 30000); // Ponovno omogočimo osveževanje
                        }).catch(err => {
                            console.error("Ni mogoče ustaviti skeniranja.", err);
                            refreshInterval = setInterval(loadData, 30000); // Ponovno omogočimo osveževanje tudi ob napaki
                        });
                    },
                    errorMessage => {
                        console.error("QR koda se ne ujema.", errorMessage);
                    }
                ).catch(err => {
                    console.error("Ni mogoče začeti skeniranja.", err);
                });
            })
            .catch(function(err) {
                alert("Kamera ni na voljo ali je prišlo do napake: " + err);
            });
    } else {
        alert("Vaša naprava ne podpira dostopa do kamere.");
    }
}

function highlightRowByCode(code) {
    const rowIndex = data.findIndex(row => row.Code === code); // Predpostavljamo, da je stolpec ime "Code"
    if (rowIndex !== -1) {
        const row = table.row(rowIndex).node();
        $(row).addClass('highlight'); // Dodaj razred za osvetlitev
    }
}
