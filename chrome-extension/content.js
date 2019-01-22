const dayCount = (date) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const theDay = new Date(date * 1000);
    const today = new Date();

    return Math.round(Math.abs((theDay.getTime() - today.getTime())/(oneDay)));
}

const prepareDataForTable = (data) => {
    // keep only seeding downloads
    data = data.filter((dl) => dl.status === 'seeding')

    let array = [['#', 'nom', 'durée', 'ratio', 'Mo/j', 'priorité']];

    data.forEach(elm => {
        const days = dayCount(elm.created_ts);
        array.push({
            id: elm.queue_pos,
            name: elm.name,
            duration: days + ' j',
            ratio: Math.round(elm.tx_bytes / elm.rx_bytes * 100) / 100,
            average: Math.round(elm.tx_bytes / days / 10000) / 100,
            priority: elm.io_priority
        });
    });

    return array;
}

const buildTable = (tableData) => {
    let table = document.createElement('table');
    table.classList.add('seed-performance__table');

    tableData.forEach(function(rowData, rowIndex) {
        let row = document.createElement('tr');

        Object.keys(rowData).forEach(function (key) {
            const cellData = rowData[key];
            let cell;

            if (rowIndex === 0) {
                cell = document.createElement('th');
            } else {
                cell = document.createElement('td');
            }

            if (key === 'name') {
                cell.setAttribute('title', cellData);
            }

            // cell.classList.add('x-grid-cell')
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });

        table.appendChild(row);
    });

    return table;
};

const addTable = (data) => {
    data = prepareDataForTable(data);

    let wrapper = document.createElement('div');
    let tableContainer = document.createElement('div');
    let toggle = document.createElement('div');

    tableContainer.appendChild(buildTable(data));

    toggle.id = 'seedPerformanceToggle';
    toggle.textContent = 'Performance seed';
    toggle.classList.add('seed-performance__toggle');

    wrapper.classList.add('seed-performance');
    wrapper
        .appendChild(tableContainer)
        // .appendChild(toggle)
    ;

    document.body.appendChild(wrapper);
};

const getData = (callback) => {
    // TODO: get it from original page, use web_accessible_resources and messages
    // https://stackoverflow.com/a/20023723/983161
    const apiBaseUrl = '/api/v6/';
    const apiDownloadUrl = 'downloads/';

    let xhr = new XMLHttpRequest();
    xhr.open('GET', apiBaseUrl + apiDownloadUrl);
    xhr.send(null);

    xhr.onreadystatechange = function () {
        const DONE = 4; // readyState 4 means the request is done.
        const OK = 200; // status 200 is a successful return.
        if (xhr.readyState === DONE) {
            if (xhr.status === OK) {
                callback(JSON.parse(xhr.responseText).result);
            } else {
                console.error('Error with API: ' + xhr.status);
            }
        }
    };
};

const init = () => {
    getData(addTable);
};

init();
