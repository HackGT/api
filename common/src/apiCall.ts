import config, { Service } from "@api/config";
import axios, { AxiosRequestConfig } from "axios";
import express from "express";

/**
 * Allows making an api call to an external service. Returns the response data or throws an error.
 * Adds authorization from the current request and forwards to the next server.
 * @param service the service to make a request to
 * @param requestConfig axios config for the request
 * @returns the response data from the api call
 */
export const apiCall = async (
  service: Service,
  requestConfig: Omit<AxiosRequestConfig<any>, "baseUrl">,
  request: express.Request
) => {
  const response = await axios.request({
    ...requestConfig,
    baseURL: config.services[service].proxy.target,
    withCredentials: true,
    headers: {
      ...(request.headers.cookie && { cookie: request.headers.cookie }),
      ...(request.headers.authorization && { authorization: request.headers.authorization }),
    },
  });

  return response.data;
};
