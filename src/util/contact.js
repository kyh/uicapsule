const endpoint = `${process.env.NEXT_PUBLIC_SHEETS_ENDPOINT}?tabId=${process.env.NEXT_PUBLIC_SHEETS_TAB_ID}&api_key=${process.env.NEXT_PUBLIC_SHEETS_API_KEY}`;

function submit(data) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([[data.name, data.email, data.message]]),
  }).then((r) => r.json());
}

export default { submit };
