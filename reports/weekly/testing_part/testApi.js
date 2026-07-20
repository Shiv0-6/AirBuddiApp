const fetch = require("node-fetch");

async function testApi() {
  const url = "https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com/devices";

  // GET request (read data)
  const getResponse = await fetch(url);
  const getData = await getResponse.json();
  console.log("GET data:", getData);

  // POST request (send command)
  const postResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "esp/control", message: "start" })
  });
  const postData = await postResponse.json();
  console.log("POST response:", postData);
}

testApi().catch(console.error);


// node testApi.js
const fetch = require("node-fetch");

async function testApi() {
  const url = "https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com/devices";

  // GET request (read data)
  const getResponse = await fetch(url);
  const getData = await getResponse.json();
  console.log("GET data:", getData);

  // POST request (send command)
  const postResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "esp/control", message: "start" })
  });
  const postData = await postResponse.json();
  console.log("POST response:", postData);
}

testApi().catch(console.error);


// node testApi.js