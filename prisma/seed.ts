import { PrismaClient, LayerType, ChallengeType, UserRole, AchievementCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const hash = (password: string, rounds: number) => bcrypt.hash(password, rounds)

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing quests to ensure fresh data with new theme configs
  // This deletes quests and their associated layers/challenges (cascade)
  console.log('🧹 Cleaning up existing quests...')
  await prisma.quest.deleteMany({
    where: {
      id: {
        in: ['tutorial-quest-001', 'auth-quest-001', 'api-quest-001', 'api-quest-002']
      }
    }
  })

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@packetjourney.com' },
    update: {},
    create: {
      email: 'admin@packetjourney.com',
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create test user
  const testPassword = await hash('test123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testplayer',
      password: testPassword,
      role: UserRole.PLAYER,
    },
  })
  console.log('✅ Test user created:', testUser.email)

  // Create tutorial quest
  const tutorialQuest = await prisma.quest.upsert({
    where: { id: 'tutorial-quest-001' },
    update: {},
    create: {
      id: 'tutorial-quest-001',
      name: 'Hello World',
      description: 'Your first journey through the stack! Learn the basics of how web requests work.',
      difficulty: 1,
      isPublic: true,
      isActive: true,
      authorId: admin.id,
      tags: ['tutorial', 'beginner'],
      layers: {
        create: [
          {
            type: LayerType.BROWSER,
            order: 0,
            challenge: {
              create: {
                type: ChallengeType.SELECT_METHOD,
                config: {
                  question: 'What HTTP method should you use to fetch data?',
                  options: ['GET', 'POST', 'PUT', 'DELETE'],
                  answer: 'GET',
                  explanation: 'GET is used to retrieve data from a server.',
                },
                maxScore: 100,
              },
            },
          },
          {
            type: LayerType.NETWORK,
            order: 1,
            timeLimit: 60,
            challenge: {
              create: {
                type: ChallengeType.PLATFORMER,
                config: {
                  obstacles: 5,
                  speed: 1,
                  obstacleTypes: ['firewall', 'latency-cloud'],
                  theme: 'http', // Tutorial: simple HTTP request/response flow
                },
                maxScore: 200,
                timeBonus: 50,
              },
            },
          },
          {
            type: LayerType.API,
            order: 2,
            challenge: {
              create: {
                type: ChallengeType.PICK_ENDPOINT,
                config: {
                  question: 'Which endpoint returns a greeting?',
                  options: ['/api/users', '/api/hello', '/api/admin'],
                  answer: '/api/hello',
                },
                maxScore: 100,
              },
            },
          },
          {
            type: LayerType.DATABASE,
            order: 3,
            challenge: {
              create: {
                type: ChallengeType.SELECT_QUERY,
                config: {
                  question: 'Select the query that fetches all users',
                  options: [
                    'SELECT * FROM users',
                    'INSERT INTO users',
                    'DELETE FROM users',
                  ],
                  answer: 'SELECT * FROM users',
                },
                maxScore: 100,
              },
            },
          },
        ],
      },
    },
  })
  console.log('✅ Tutorial quest created:', tutorialQuest.name)

  // Create intermediate quest
  const intermediateQuest = await prisma.quest.upsert({
    where: { id: 'auth-quest-001' },
    update: {},
    create: {
      id: 'auth-quest-001',
      name: 'Secure the Gate',
      description: 'Learn about authentication and secure API requests.',
      difficulty: 3,
      isPublic: true,
      isActive: true,
      authorId: admin.id,
      tags: ['authentication', 'security', 'intermediate'],
      layers: {
        create: [
          {
            type: LayerType.BROWSER,
            order: 0,
            challenge: {
              create: {
                type: ChallengeType.ADD_HEADERS,
                config: {
                  requiredHeaders: ['Authorization'],
                  headerHints: {
                    Authorization: 'Bearer token for authentication',
                  },
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.NETWORK,
            order: 1,
            timeLimit: 45,
            challenge: {
              create: {
                type: ChallengeType.PLATFORMER,
                config: {
                  obstacles: 10,
                  speed: 1.5,
                  obstacleTypes: ['firewall', 'mitm-attack', 'packet-loss'],
                  theme: 'auth', // Auth quest: credentials -> token -> session
                },
                maxScore: 250,
                timeBonus: 75,
              },
            },
          },
          {
            type: LayerType.API,
            order: 2,
            challenge: {
              create: {
                type: ChallengeType.MIDDLEWARE_SEQUENCE,
                config: {
                  steps: ['validate-token', 'check-permissions', 'rate-limit'],
                  correctOrder: [0, 1, 2],
                },
                maxScore: 200,
              },
            },
          },
          {
            type: LayerType.DATABASE,
            order: 3,
            challenge: {
              create: {
                type: ChallengeType.WRITE_QUERY,
                config: {
                  template: 'SELECT * FROM users WHERE id = ?',
                  placeholders: ['?'],
                  hint: 'Use parameterized queries to prevent SQL injection',
                },
                maxScore: 200,
              },
            },
          },
        ],
      },
    },
  })
  console.log('✅ Intermediate quest created:', intermediateQuest.name)

  // Create API mastery quest
  const apiQuest = await prisma.quest.upsert({
    where: { id: 'api-quest-001' },
    update: {},
    create: {
      id: 'api-quest-001',
      name: 'REST API Explorer',
      description: 'Master the fundamentals of REST APIs - HTTP methods, status codes, headers, and CRUD operations.',
      difficulty: 2,
      isPublic: true,
      isActive: true,
      authorId: admin.id,
      tags: ['api', 'rest', 'http', 'intermediate'],
      layers: {
        create: [
          {
            type: LayerType.BROWSER,
            order: 0,
            challenge: {
              create: {
                type: ChallengeType.SELECT_METHOD,
                config: {
                  question: 'You want to create a new user account. Which HTTP method should you use?',
                  options: ['GET', 'POST', 'PUT', 'DELETE'],
                  answer: 'POST',
                  explanation: 'POST is used to create new resources on the server. It sends data in the request body.',
                },
                maxScore: 100,
              },
            },
          },
          {
            type: LayerType.NETWORK,
            order: 1,
            timeLimit: 60,
            challenge: {
              create: {
                type: ChallengeType.PLATFORMER,
                config: {
                  obstacles: 8,
                  speed: 1.2,
                  obstacleTypes: ['latency-cloud', 'packet-loss', 'rate-limit'],
                  levelLength: 4000,
                  theme: 'api', // API quest: endpoint -> method -> status
                },
                maxScore: 200,
                timeBonus: 50,
              },
            },
          },
          {
            type: LayerType.API,
            order: 2,
            challenge: {
              create: {
                type: ChallengeType.STATUS_CODE_MATCH,
                config: {
                  scenario: 'The user tried to access their profile without logging in first.',
                  statusCodes: [200, 401, 403, 404],
                  correctCode: 401,
                  explanation: '401 Unauthorized means authentication is required. The user must log in first.',
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.DATABASE,
            order: 3,
            challenge: {
              create: {
                type: ChallengeType.SELECT_QUERY,
                config: {
                  question: 'Select the query that inserts a new user',
                  options: [
                    'SELECT * FROM users WHERE email = ?',
                    'INSERT INTO users (name, email) VALUES (?, ?)',
                    'UPDATE users SET name = ? WHERE id = ?',
                  ],
                  answer: 'INSERT INTO users (name, email) VALUES (?, ?)',
                },
                maxScore: 100,
              },
            },
          },
        ],
      },
    },
  })
  console.log('✅ API mastery quest created:', apiQuest.name)

  // Create advanced API quest
  const advancedApiQuest = await prisma.quest.upsert({
    where: { id: 'api-quest-002' },
    update: {},
    create: {
      id: 'api-quest-002',
      name: 'HTTP Status Code Master',
      description: 'Deep dive into HTTP status codes - learn what each code means and when to use them.',
      difficulty: 3,
      isPublic: true,
      isActive: true,
      authorId: admin.id,
      tags: ['api', 'status-codes', 'http', 'advanced'],
      layers: {
        create: [
          {
            type: LayerType.BROWSER,
            order: 0,
            challenge: {
              create: {
                type: ChallengeType.ADD_HEADERS,
                config: {
                  requiredHeaders: ['Content-Type', 'Accept'],
                  headerHints: {
                    'Content-Type': 'Tells the server the format of the request body (e.g., application/json)',
                    Accept: 'Tells the server what response formats the client can handle',
                  },
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.NETWORK,
            order: 1,
            timeLimit: 50,
            challenge: {
              create: {
                type: ChallengeType.PLATFORMER,
                config: {
                  obstacles: 10,
                  speed: 1.3,
                  obstacleTypes: ['firewall', 'latency-cloud', 'rate-limit'],
                  levelLength: 4500,
                  theme: 'api', // API theme: endpoint -> method -> status
                },
                maxScore: 250,
                timeBonus: 60,
              },
            },
          },
          {
            type: LayerType.API,
            order: 2,
            challenge: {
              create: {
                type: ChallengeType.STATUS_CODE_MATCH,
                config: {
                  scenario: 'The server successfully created a new resource and is returning its details.',
                  statusCodes: [200, 201, 204, 301],
                  correctCode: 201,
                  explanation: '201 Created indicates a new resource was successfully created. Often includes the new resource in the response.',
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.API,
            order: 3,
            challenge: {
              create: {
                type: ChallengeType.STATUS_CODE_MATCH,
                config: {
                  scenario: 'The user is authenticated but does not have permission to delete this resource.',
                  statusCodes: [400, 401, 403, 404],
                  correctCode: 403,
                  explanation: '403 Forbidden means the user is authenticated but lacks permission. Unlike 401, logging in again won\'t help.',
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.API,
            order: 4,
            challenge: {
              create: {
                type: ChallengeType.STATUS_CODE_MATCH,
                config: {
                  scenario: 'The server is overloaded and cannot handle the request right now.',
                  statusCodes: [400, 500, 502, 503],
                  correctCode: 503,
                  explanation: '503 Service Unavailable indicates the server is temporarily overloaded or under maintenance.',
                },
                maxScore: 150,
              },
            },
          },
          {
            type: LayerType.DATABASE,
            order: 5,
            challenge: {
              create: {
                type: ChallengeType.SELECT_QUERY,
                config: {
                  question: 'Which query checks if a user exists before inserting?',
                  options: [
                    'SELECT COUNT(*) FROM users WHERE email = ?',
                    'DELETE FROM users WHERE email = ?',
                    'TRUNCATE TABLE users',
                  ],
                  answer: 'SELECT COUNT(*) FROM users WHERE email = ?',
                },
                maxScore: 100,
              },
            },
          },
        ],
      },
    },
  })
  console.log('✅ Advanced API quest created:', advancedApiQuest.name)

  // Create achievements
  const achievements = [
    {
      name: 'First Steps',
      description: 'Complete your first quest',
      icon: '🎯',
      category: AchievementCategory.PROGRESS,
      condition: { questsCompleted: 1 },
      xpReward: 100,
    },
    {
      name: 'Speed Demon',
      description: 'Complete a network layer in under 30 seconds',
      icon: '⚡',
      category: AchievementCategory.SPEED,
      condition: { layerType: 'NETWORK', maxTime: 30 },
      xpReward: 200,
    },
    {
      name: 'Perfect Run',
      description: 'Complete a quest without taking damage',
      icon: '💎',
      category: AchievementCategory.SKILL,
      condition: { noDamage: true },
      xpReward: 500,
    },
    {
      name: 'Query Master',
      description: 'Complete 10 database challenges',
      icon: '🗄️',
      category: AchievementCategory.COLLECTION,
      condition: { challengeType: 'DATABASE', count: 10 },
      xpReward: 300,
    },
    {
      name: 'API Expert',
      description: 'Complete 5 API layer challenges',
      icon: '🔌',
      category: AchievementCategory.COLLECTION,
      condition: { challengeType: 'API', count: 5 },
      xpReward: 250,
    },
    {
      name: 'Status Code Sage',
      description: 'Correctly identify 10 HTTP status codes',
      icon: '📊',
      category: AchievementCategory.SKILL,
      condition: { challengeType: 'STATUS_CODE_MATCH', count: 10 },
      xpReward: 400,
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    })
  }
  console.log('✅ Achievements created:', achievements.length)

  console.log('🌱 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
