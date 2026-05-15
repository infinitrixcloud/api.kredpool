import axios from "axios";

export class VendorService {
  private static aadhaarBaseUrl = "https://lvf.listspl.com:1355/ListValidationFramework";
  private static panUrl = "https://kyc-api.aadhaarkyc.io/api/v1/pan/pan";

  private static async getAadhaarToken() {
    const response = await axios.post(`${this.aadhaarBaseUrl}/api/auth/signIn`, {
      userName: "Kredpooluser",
      password: "Kred@123",
    });
    return response.data.token;
  }

  static async sendAadhaarOtp(aadhaarNumber: string) {
    const token = await this.getAadhaarToken();
    const response = await axios.post(
      `${this.aadhaarBaseUrl}/validator/aadhaar_sendotp`,
      { id_number: aadhaarNumber },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          bankName: "Kredpool Solutions Pvt Ltd",
          branchName: "HEAD Office",
          userName: "KredpoolUser",
          callerSystem: "SysKred",
        },
      }
    );
    return response.data.data;
  }

  static async verifyAadhaarOtp(otp: string, clientId: string, id_number: string) {
    const token = await this.getAadhaarToken();
    const response = await axios.post(
      `${this.aadhaarBaseUrl}/validator/aadhaar_verifyotp`,
      { otp: otp, client_id: clientId, id_number: id_number },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          bankName: "Kredpool Solutions Pvt Ltd",
          branchName: "HEAD Office",
          userName: "KredpoolUser",
          callerSystem: "SysKred",
        },
      }
    );
    return response.data.data;
  }

  static async verifyPan(panNumber: string) {
    console.log("panNumber", panNumber);
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNTY5MjMyNiwianRpIjoiNzcxMzZmYWEtYzM2MC00MDY5LWIzZGUtODMyNWVmZmYwZWEwIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnVzZXJuYW1lXzJ2MHBpZGNhdHlpdTJvcjVmbjV5OG96aG9oc0BzdXJlcGFzcy5pbyIsIm5iZiI6MTcxNTY5MjMyNiwiZXhwIjoyMDMxMDUyMzI2LCJlbWFpbCI6InVzZXJuYW1lXzJ2MHBpZGNhdHlpdTJvcjVmbjV5OG96aG9oc0BzdXJlcGFzcy5pbyIsInRlbmFudF9pZCI6Im1haW4iLCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.7Mz0n2rBsMQUpu0m6-AYn7ZaSrUkiprnhANo3678wIc";
    const response = await axios.post(
      this.panUrl,
      { id_number: panNumber },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  }
}
