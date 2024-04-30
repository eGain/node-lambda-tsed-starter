import axios from "axios"

export class RestCallAdapter {
  private axiosInstance = axios.create({
    baseURL: "http://localhost:1080",
    timeout: 60000
  })

  async simpleGet<T>(path: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(path)
    return response.data
  }
}
