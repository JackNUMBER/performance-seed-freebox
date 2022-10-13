let isTableOpen = false;

const dayCount = (date) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const theDay = new Date(date * 1000);
  const today = new Date();

  return Math.round(Math.abs((theDay.getTime() - today.getTime()) / oneDay));
};

// source: https://gist.github.com/mlocati/7210513
const getScaleColor = (value) => {
  let r,
    g,
    b = 0;
  if (value < 50) {
    r = 248;
    g = Math.round(5.1 * value);
  } else {
    g = 190;
    r = Math.round(510 - 5.1 * value);
  }

  return 'rgba(' + r + ',' + g + ',' + b + ',0.7)';
};

const getMaxFromObjects = (data, key) => {
  // on vire la ligne de titre >_>
  let extract = data.filter((data) => data[key] !== undefined);
  extract = extract.map((data) => data[key]);

  return Math.max.apply(null, extract);
};

const round = (number, decimals) => {
  const factor = Number(`1${'0'.repeat(decimals)}`);
  return Math.round(number * factor) / factor;
};

const prepareDataForTable = (data) => {
  // keep only seeding downloads
  data = data.filter((dl) => dl.status === 'seeding');

  let array = [['#', 'nom', 'durée', 'ratio', 'ratio/j', 'Mo/j', 'priorité']];

  data.forEach((elm) => {
    const days = dayCount(elm.created_ts);
    const daysCompute = days > 0 ? days : 1;
    const ratio = elm.tx_bytes / elm.rx_bytes;
    array.push({
      id: elm.queue_pos,
      name: elm.name,
      duration: `${days} j`,
      ratio: round(ratio, 2),
      ratioByDay: round(ratio / days, 2),
      bytesByDay: round(elm.tx_bytes / daysCompute / 1000000, 1),
      priority: elm.io_priority,
    });
  });

  return array;
};

const buildTable = (tableData) => {
  let table = document.createElement('table');

  table.classList.add('seed-performance__table');

  tableData.forEach((rowData, rowIndex) => {
    let row = document.createElement('tr');

    Object.keys(rowData).forEach((key) => {
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

      if (key === 'bytesByDay') {
        const percent = Math.round(
          (cellData * 100) / getMaxFromObjects(tableData, 'bytesByDay'),
        );
        cell.style.color = 'rgba(0,0,0,0.7)';
        cell.style.backgroundColor = getScaleColor(percent);
      }

      if (key === 'ratioByDay') {
        const percent = Math.round(
          (cellData * 100) / getMaxFromObjects(tableData, 'ratioByDay'),
        );
        cell.style.color = 'rgba(0,0,0,0.7)';
        cell.style.backgroundColor = getScaleColor(percent);
      }

      // cell.classList.add('x-grid-cell')
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  return table;
};

const addTable = (data, targetNode) => {
  data = prepareDataForTable(data);
  let tableContainer;
  const tableContainerId = 'tableContainer';

  if (document.contains(document.querySelector('#' + tableContainerId))) {
    // update
    tableContainer = document.querySelector('#' + tableContainerId);
    while (tableContainer.firstChild) {
      tableContainer.removeChild(tableContainer.firstChild); // empty all tree
    }
  } else {
    // first time
    tableContainer = document.createElement('div');
    tableContainer.id = tableContainerId;
    tableContainer.classList.add('seed-performance__table-container');
  }

  tableContainer.appendChild(buildTable(data));
  targetNode.appendChild(tableContainer);
};

const getData = (callback, targetNode) => {
  // TODO: get it from original page, use web_accessible_resources and messages
  // https://stackoverflow.com/a/20023723/983161
  const apiDownloadUrl = window.location.origin + '/api/v6/downloads/';

  let xhr = new XMLHttpRequest();
  xhr.open('GET', apiDownloadUrl);
  xhr.send(null);

  xhr.onreadystatechange = () => {
    const DONE = 4; // readyState 4 means the request is done.
    const OK = 200; // status 200 is a successful return.
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
        callback(JSON.parse(xhr.responseText).result, targetNode);
      } else {
        console.error('Error with API: ' + xhr.status);
      }
    }
  };
};

const setToggle = (targetNode) => {
  let toggle = document.createElement('span');
  toggle.id = 'seedPerformanceToggle';
  toggle.textContent = 'Performance seed';
  toggle.classList.add('seed-performance__toggle');
  toggle.addEventListener('click', () => {
    if (!isTableOpen) {
      targetNode.classList.add('active');
    } else {
      targetNode.classList.remove('active');
    }
    isTableOpen = !isTableOpen;
  });

  if (isTableOpen) {
    targetNode.classList.add('active');
  }

  targetNode.appendChild(toggle);
};

const setToast = (targetNode) => {
  let toast = document.createElement('span');
  toast.id = 'seedPerformanceToast';
  toast.textContent = '✔ Mis à jour';
  toast.classList.add('seed-performance__toast');

  targetNode.appendChild(toast);
};

const displayToast = () => {
  let toast = document.querySelector('#seedPerformanceToast');
  // reset animation
  toast.classList.remove('toasted');
  void toast.offsetWidth;

  toast.classList.add('toasted');
};

const setUpdate = (targetNode) => {
  setTimeout(() => {
    if (isTableOpen) {
      getData(addTable, targetNode);
      displayToast();
    }
    setUpdate(targetNode); // and again, and again...
  }, 60000);
};

const init = () => {
  let wrapper = document.createElement('div');
  wrapper.id = 'seedPerformance';
  wrapper.classList.add('seed-performance');
  document.body.appendChild(wrapper);

  getData(addTable, wrapper);
  setToggle(wrapper);
  setToast(wrapper);
  setUpdate(wrapper);
};

if (document.title === 'Freebox OS') {
  init();
}
