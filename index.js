const axios = require("axios");
const express = require("express");
const app = express();
const https = require("https");
const externalUrl = "https://api.data.gov.sg/v1/transport/carpark-availability";
const port = 3000;

app.listen(port);
console.log("Server started at http://localhost:" + port);

app.get("/", async function (req, res) {
  let small = []; // less than 100
  let medium = []; // 100 or more, less than 300
  let big = []; // 300 or more, less than 400
  let large = []; // 400 or more

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  axios.defaults.httpsAgent = httpsAgent;
  async function doGetRequest() {
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

    sortArray(small);
    sortArray(medium);
    sortArray(big);
    sortArray(large);
  }

  try {
    await doGetRequest();
  } catch (error) {
    console.log(error);
  }

  let result = "";
  result += "<h1>Singapore Carpark Availability<h1/>";

  result = displayData(result, "Small", small);
  result = displayData(result, "Medium", medium);
  result = displayData(result, "Big", big);
  result = displayData(result, "Large", large);

  result += "<script>";
  result += "setInterval('window.location.reload()',10000)";
  result += "</script>";

  res.send(result);

  //   res.send([
  //     { small: small },
  //     { medium: medium },
  //     { big: big },
  //     { large: large },
  //   ]);
});

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
