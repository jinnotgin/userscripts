// ==UserScript==
// @name         SimplyGo Export
// @version      0.1
// @author       Jin
// @match        https://simplygo.transitlink.com.sg/Cards/Transactions
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // csv export function
    function exportToCsv(filename, rows) {
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    const classNameForExportRow = 'jin-select-for-export';
    // add checkboxes per row
    const addCheckboxesToTransactionRows = (className) => {
        function createNewCheckbox(name){
            const blockEvent = (e) => e.stopPropagation();
            var checkbox = document.createElement('input');
            checkbox.type= 'checkbox';
            checkbox.className = name;
            checkbox.addEventListener('click', blockEvent);
            return checkbox;
        }

        const transaction_rows = document.querySelectorAll('table.Table-payment-statement.table.table-condensed');
        [...transaction_rows].map(transaction => {
            if (transaction.querySelectorAll(`input.${className}`).length == 0) {
                const transaction_fields = transaction.querySelectorAll('td');

                // create the checkbox
                transaction_fields[0].prepend(createNewCheckbox(className));
                transaction_fields[0].style.width = '10%';
            }
        });

        // add shift handler
        function allow_group_select_checkboxes(checkbox_wrapper_class){
            var lastChecked = null;
            var checkboxes = document.querySelectorAll(`input[type="checkbox"].${checkbox_wrapper_class}`);

            //I'm attaching an index attribute because it's easy, but you could do this other ways...
            [...checkboxes].map((item,i) => item.setAttribute('data-index',i));

            const checkBoxShiftHandler = (e) => {
                const currentCheckbox = e.target;

                if(lastChecked && e.shiftKey) {
                    var i = parseInt(lastChecked.getAttribute('data-index'));
                    var j = parseInt(currentCheckbox.getAttribute('data-index'));
                    var check_or_uncheck = currentCheckbox.checked;

                    var low = i; var high=j;
                    if (i>j){
                        low = j; high=i;
                    }

                    //console.log(low, high, checkboxes);

                    for(var c=0;c<checkboxes.length;c++){
                        if (low <= c && c <=high){
                            checkboxes[c].checked = check_or_uncheck;
                        }
                    }
                }
                lastChecked = currentCheckbox;
            };

            [...checkboxes].map(item => item.addEventListener("click", checkBoxShiftHandler));
        }
        allow_group_select_checkboxes(className);
    }
    addCheckboxesToTransactionRows(classNameForExportRow);

    // add button to re-add checkboxes
    function addButtonThatAddMoreCheckboxes(){
        var button = document.createElement('input');
        button.type= 'button';
        button.value = 'Add Checkboxes';
        button.addEventListener('click', () => addCheckboxesToTransactionRows());

        document.querySelector('#Search_form div.form').appendChild(button);
        return button;
    }
    addButtonThatAddMoreCheckboxes();

    // prepare export information
    const prepareExportArray = () => {
        const selectedCheckboxes = document.querySelectorAll('input.jin-select-for-export:checked');

        const getDateString = dateString => {
            var date = new Date(dateString);
            var userTimezoneOffset = date.getTimezoneOffset() * 60000;

            var dateForExportOnly = new Date(date.getTime() - userTimezoneOffset);
            return dateForExportOnly.toISOString().split('T')[0];
        }
        const getJourneyInformation = row => {
            const fields = row.querySelectorAll('td');

            const neededFields = [fields[1], fields[2], fields[3]];

            let outputFields = neededFields.map( field => field.textContent.trim() );

            // modify content
            outputFields[0] = getDateString(outputFields[0]); // date
            outputFields[1] = `BUS/MRT: ${outputFields[1].split('[Posting Ref No')[0].trim()}`; // description
            outputFields.unshift('Transport');
            return outputFields;
        }
        const findRowFromCheckbox = checkboxNode => checkboxNode.parentNode.parentNode;

        const exportFields = [...selectedCheckboxes].reduce((acc, checkboxItem) => {
            const row = findRowFromCheckbox(checkboxItem);

            const journeyInfo = getJourneyInformation(row);

            return [...acc, journeyInfo];
        },[]);

        return [ ['Category', 'Date', 'Description', 'Amount'], ...exportFields];
    }

    // generalised method to add an Export button
    [...document.querySelectorAll('input[type="button"]')].map(button => {
        if (button.value.toLowerCase().includes('download')) {
            // create export button

            let exportButton = button.cloneNode();
            exportButton.id = 'jin_export_transactions';
            exportButton.value = 'EXPORT CSV';
            exportButton.style.backgroundColor = '#3cb371';
            exportButton.addEventListener('click', () => {
                const selected_data = prepareExportArray();

                exportToCsv('simplygo_export.csv', selected_data);
            });

            button.parentNode.append(exportButton);
        }
    });
})();
