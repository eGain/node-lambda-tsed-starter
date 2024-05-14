import axios, { AxiosInstance } from "axios"

export class RestCallAdapter {
  private axiosInstance: AxiosInstance

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 60000
    })
  }

  async simpleGet<T>(path: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(path)
    return response.data
  }
}
