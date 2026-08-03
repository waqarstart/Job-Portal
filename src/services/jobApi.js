import axios from "axios";

const API = "https://remotive.com/api/remote-jobs";

export async function searchJobs(title = "") {
  try {
    const response = await axios.get(API, {
      params: {
        search: title,
        limit: 50,
      },
    });

    return response.data.jobs;
  } catch (error) {
    console.error(error);
    return [];
  }
}