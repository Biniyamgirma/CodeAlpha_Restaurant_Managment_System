const getAllUsers = async (req, res) => {
  // This is where you would typically call a service to fetch users from a database.
  // For example:
  // import * as userService from '../services/userService.js';
  // const users = await userService.findAll();
  // If the above line throws an error, `express-async-errors` will catch it.

  // Using placeholder data for now:
  const users = [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Doe' }];

  res.status(200).json(users);
};

export default getAllUsers;