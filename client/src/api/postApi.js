import axios from "axios";

const API_URL = "http://localhost:5000/api/posts";

export const getPosts = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createPost = async (post, token) => {
  const res = await axios.post(API_URL, post, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
