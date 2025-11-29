import { PrismaClient, LayerType, ChallengeType, UserRole, AchievementCategory } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

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
