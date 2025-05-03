import axios from 'axios';
import { getApiToken } from './tokenService';

export async function validateAccount(accountNumber:string, bankCode:string ) {
  const token = "609dab841280674f1a780272f59e9e4e";

  //console.log(token)
  try {
    const { data } = await axios.post(
      'https://account-validation-service.dev.pesalink.co.ke/api/validate',
      { accountNumber, bankCode },
      { headers: { Authorization: `Bearer ${token}` } }
      
    );

    const maskedAccountNumber = accountNumber.replace(/^(\d{4})/, '####');
    const accNo = '####' + accountNumber.slice(4);

    return {...data, accNo};
  } catch (error: any) {
    return { status: 'Error', message: error.message };
  }
}