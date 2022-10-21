const axios = require("axios");
const express = require("express");
const app = express();
const https = require("https");
const externalUrl = "https://api.data.gov.sg/v1/transport/carpark-availability";
const port = 3000;

let result = "";

app.listen(port);
console.log("Server started at http://localhost:" + port);

app.get("/", async function (req, res) {
  try {
    await doGetRequest();
    res.send(result);
  } catch (error) {}
});

async function doGetRequest() {
  let small = []; // less than 100
  let medium = []; // 100 or more, less than 300
  let big = []; // 300 or more, less than 400
  let large = []; // 400 or more

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  axios.defaults.httpsAgent = httpsAgent;
  let res = await axios.get(externalUrl);
  [...res.data.items[0].carpark_data].forEach((carpark) => {
    carpark.carpark_info.forEach((info) => {
      if (info.total_lots < 100) {
        saveData(small, carpark, info);
      } else if (info.total_lots < 300) {
        saveData(medium, carpark, info);
      } else if (info.total_lots < 400) {
        saveData(big, carpark, info);
      } else {
        saveData(large, carpark, info);
      }
    });
  });

  small = sortArray(small);
  medium = sortArray(medium);
  big = sortArray(big);
  large = sortArray(large);

  result = "";
  result += "<h1>Singapore Carpark Availability<h1/>";
  result = displayData(result, "Small", small);
  result = displayData(result, "Medium", medium);
  result = displayData(result, "Big", big);
  result = displayData(result, "Large", large);
  result += "<script>";
  result += "setInterval('window.location.reload()',10000)";
  result += "</script>";
}

function saveData(arr, data, detail) {
  arr.push({
    carparkNo: data.carpark_number,
    type: detail.lot_type,
    total: detail.total_lots,
    available: detail.lots_available,
  });
}

function sortArray(arr) {
  let done = false;
  while (!done) {
    done = true;
    for (let i = 1; i < arr.length; i++) {
      if (parseInt(arr[i - 1].available) < parseInt(arr[i].available)) {
        done = false;
        let tmp = arr[i - 1];
        arr[i - 1] = arr[i];
        arr[i] = tmp;
      }
    }
  }
  let highestArr = getHighestList(arr);
  let lowestArr = getLowestList(arr);
  arr = [...highestArr, ...lowestArr];
  return arr;
}

function getHighestList(arr) {
  let highest = arr[0];
  let highestArr = [highest];

  for (let i = 1; i < arr.length; i++) {
    if (parseInt(highest.available) > parseInt(arr[i].available)) {
      break;
    } else {
      highestArr.push(arr[i]);
    }
  }
  return highestArr;
}
function getLowestList(arr) {
  let lowest = arr[arr.length - 1];
  let lowestArr = [lowest];

  for (let i = arr.length - 2; i < arr.length; i--) {
    if (parseInt(lowest.available) < parseInt(arr[i].available)) {
      break;
    } else {
      lowestArr.push(arr[i]);
    }
  }
  return lowestArr;
}

function displayData(result, type, content) {
  result += '<h3 style="margin:20px;">' + type + "</h3>";

  result += '<table style="border:1px solid black; margin:20px; ">';
  result +=
    "</td>   <td>Item_No.</td>   <td> Carpark_No</td>    <td> Lot_Type </td>  <td> Total_Carpark</td>  <td> Availability</td> </th>";
  for (let item in content) {
    result +=
      '<tr><td style="text-align:center">' +
      item +
      '</td><td style="text-align:center">' +
      content[item].carparkNo +
      '</td> <td style="text-align:center">' +
      content[item].type +
      '</td> <td style="text-align:center">' +
      content[item].total +
      '</td> <td style="text-align:center">' +
      content[item].available +
      "</td></tr>";
  }
  result += "</table>";

  return result;
}
