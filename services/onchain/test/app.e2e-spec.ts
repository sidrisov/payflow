import { Test } from '@nestjs/testing';
import { describe, it, beforeEach, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    const response = await supertest(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toBe('Hello World!');
  });
});
