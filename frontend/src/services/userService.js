import api from './api';

const userService = {
  getUsers: () => api.get('/auth/users'),

  createUser: (data) => api.post('/auth/register', data),

  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

export default userService;
