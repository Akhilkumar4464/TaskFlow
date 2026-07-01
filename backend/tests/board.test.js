import request from 'supertest';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Board from '../src/models/Board.js';

describe('Board, Column and Task CRUD API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const testUser = {
      name: 'Board Tester',
      email: 'tester@example.com',
      password: 'password123',
    };
    const user = await User.create(testUser);
    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    token = loginRes.body.token;
  });

  it('should create a board with default columns', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sprint Board' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Sprint Board');
    expect(res.body.columns).toHaveLength(3); // To Do, In Progress, Done
    expect(res.body.columns[0].title).toBe('To Do');
  });

  it('should create a task inside a column', async () => {
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Project Beta' });
    
    const bId = boardRes.body._id;
    const colId = boardRes.body.columns[0]._id;

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Design Logo',
        description: 'Create svg icons',
        boardId: bId,
        columnId: colId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Design Logo');
    expect(res.body.columnId).toBe(colId);
  });
});
