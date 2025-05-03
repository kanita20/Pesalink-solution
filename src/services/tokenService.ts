import axios from 'axios';

let cachedToken = '';
let expiry = 0;

export async function getApiToken() {
  const now = Date.now();
  if (cachedToken && now < expiry) return cachedToken;

  const { data } = await axios.get('https://account-validation-service.dev.pesalink.co.ke/api/key');
  //console.log(data)
  cachedToken = data.apiKey;
  expiry = now + 60 * 60 * 1000;
  return cachedToken;
}