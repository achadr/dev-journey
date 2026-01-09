import { BaseScene, SceneData } from './BaseScene'
import { EventBus } from '../EventBus'

// SQL Query Types
export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP'

// Challenge types for database layer
export type DatabaseChallengeType = 'SELECT_QUERY' | 'WRITE_QUERY' | 'FIX_QUERY'

// Database schema structure
interface TableColumn {
  name: string
  type: string
}

interface TableData {
  name: string
  columns: string[] | TableColumn[]
  rows: number
  primaryKey?: string
}

interface DatabaseSchema {
  tables: TableData[]
}

// Query option for multiple choice
interface QueryOption {
  query: string
  isCorrect: boolean
  explanation?: string
}

// Educational info for SQL operations
const QUERY_TYPE_INFO: Record<QueryType, { title: string; description: string }> = {
  SELECT: {
    title: 'SELECT Query',
    description: 'Retrieves data from one or more tables. The most common SQL operation for reading data.',
  },
  INSERT: {
    title: 'INSERT Query',
    description: 'Adds new records to a table. Used to create new data in the database.',
  },
  UPDATE: {
    title: 'UPDATE Query',
    description: 'Modifies existing records in a table. Can update one or multiple rows.',
  },
  DELETE: {
    title: 'DELETE Query',
    description: 'Removes records from a table. Use WHERE clause to avoid deleting all rows.',
  },
  CREATE: {
    title: 'CREATE Statement',
    description: 'Creates new database objects like tables, indexes, or databases.',
  },
  DROP: {
    title: 'DROP Statement',
    description: 'Permanently removes database objects. Use with caution!',
  },
}

// Educational tips for SQL best practices
const SQL_TIPS = [
  'Always use WHERE clause with UPDATE and DELETE to avoid affecting all rows',
  'Use parameterized queries to prevent SQL injection attacks',
  'Index frequently queried columns to improve performance',
  'Use LIMIT to restrict the number of results returned',
  'Always backup before running destructive operations',
]

export class DatabaseScene extends BaseScene {
  // Challenge configuration
  private challengeType!: DatabaseChallengeType
  private correctQuery!: string
  private queryOptions: QueryOption[] = []
  private schema!: DatabaseSchema
  private question!: string

  // UI elements
  private tableContainers: Phaser.GameObjects.Container[] = []
  private queryButtons: Phaser.GameObjects.Rectangle[] = []
  private feedbackText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text
  private scoreDisplay!: Phaser.GameObjects.Text

  // State
  private selectedQuery: string | null = null
  private isCorrect: boolean = false
  private hintsUsed: number = 0
  private baseScore: number = 100
  private submitted: boolean = false

  constructor() {
    super('DatabaseScene')
  }

  init(data: SceneData): void {
    super.init(data)
    this.parseChallenge()
    this.resetState()
  }

  private resetState(): void {
    this.selectedQuery = null
    this.isCorrect = false
    this.hintsUsed = 0
    this.submitted = false
    this.tableContainers = []
    this.queryButtons = []
  }

  private parseChallenge(): void {
    const challenge = this.layerConfig?.challenge
    if (!challenge) {
      this.setupDefaultChallenge()
      return
    }

    this.challengeType = challenge.type as DatabaseChallengeType
    const config = challenge.config as {
      question?: string
      correctQuery?: string
      options?: string[]
      answer?: string
      schema?: DatabaseSchema
      brokenQuery?: string
      hint?: string
    }

    this.question = config.question || 'Complete the SQL challenge'
    this.correctQuery = config.correctQuery || config.answer || ''

    // Parse schema or use default
    this.schema = config.schema || this.getDefaultSchema()

    // Build query options based on challenge type
    this.buildQueryOptions(config)
  }

  private setupDefaultChallenge(): void {
    this.challengeType = 'SELECT_QUERY'
    this.question = 'Select all users from the database'
    this.correctQuery = 'SELECT * FROM users'
    this.schema = this.getDefaultSchema()
    this.buildQueryOptions({})
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      tables: [
        {
          name: 'users',
          columns: ['id', 'name', 'email', 'created_at'],
          rows: 150,
          primaryKey: 'id',
        },
        {
          name: 'posts',
          columns: ['id', 'user_id', 'title', 'content'],
          rows: 420,
          primaryKey: 'id',
        },
      ],
    }
  }

  private buildQueryOptions(config: { options?: string[]; brokenQuery?: string }): void {
    this.queryOptions = []

    if (config.options && config.options.length > 0) {
      // Use provided options
      config.options.forEach((option: string) => {
        this.queryOptions.push({
          query: option,
          isCorrect: option === this.correctQuery,
        })
      })
    } else if (this.challengeType === 'FIX_QUERY' && config.brokenQuery) {
      // For FIX_QUERY, show broken query and correct options
      this.queryOptions = [
        { query: config.brokenQuery, isCorrect: false, explanation: 'This query has a syntax error' },
        { query: this.correctQuery, isCorrect: true, explanation: 'Correct! This query is valid' },
        { query: 'DROP TABLE users', isCorrect: false, explanation: 'This would delete the entire table!' },
      ]
    } else {
      // Generate sensible options based on the correct query
      this.queryOptions = this.generateQueryOptions()
    }
  }

  private generateQueryOptions(): QueryOption[] {
    const options: QueryOption[] = [
      { query: this.correctQuery, isCorrect: true },
    ]

    // Add some common wrong options based on challenge type
    if (this.challengeType === 'SELECT_QUERY') {
      options.push(
        { query: 'INSERT INTO users VALUES (?)', isCorrect: false },
        { query: 'DELETE FROM users', isCorrect: false },
        { query: 'UPDATE users SET name = ?', isCorrect: false }
      )
    } else if (this.challengeType === 'WRITE_QUERY') {
      options.push(
        { query: 'SELECT * FROM users', isCorrect: false },
        { query: 'DROP TABLE users', isCorrect: false },
        { query: 'DELETE * FROM users', isCorrect: false }
      )
    }

    // Shuffle options
    return this.shuffleArray(options)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  create(): void {
    super.create()

    this.createBackground()
    this.createDatabaseVisualization()
    this.createQueryInterface()
    this.createUI()

    EventBus.on('game:resume', this.resumeGame, this)
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main

    // Database-themed background (data center aesthetic)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1929)
      .setScrollFactor(0)
      .setDepth(-10)

    // Grid pattern for server room aesthetic
    const gridSize = 40
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        this.add.rectangle(x, y, 1, gridSize, 0x1e3a5f, 0.2)
          .setScrollFactor(0)
          .setDepth(-9)
        this.add.rectangle(x, y, gridSize, 1, 0x1e3a5f, 0.2)
          .setScrollFactor(0)
          .setDepth(-9)
      }
    }

    // Title
    this.add.text(width / 2, 40, '🗄️ DATABASE LAYER', {
      fontSize: '32px',
      color: '#60a5fa',
      fontStyle: 'bold',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
  }

  private createDatabaseVisualization(): void {
    const { centerX } = this.cameras.main
    const startY = 120
    const tableSpacing = 200

    this.schema.tables.forEach((table, index) => {
      const x = centerX - (this.schema.tables.length - 1) * tableSpacing / 2 + index * tableSpacing
      const container = this.createTableVisualization(table, x, startY)
      this.tableContainers.push(container)
    })
  }

  private createTableVisualization(table: TableData, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    // Table background
    const tableHeight = 40 + table.columns.length * 30
    const tableWidth = 180

    const bg = this.add.rectangle(0, 0, tableWidth, tableHeight, 0x1e40af, 0.3)
      .setStrokeStyle(2, 0x3b82f6)
    container.add(bg)

    // Table name
    const tableName = this.add.text(0, -tableHeight / 2 + 20, table.name.toUpperCase(), {
      fontSize: '16px',
      color: '#93c5fd',
      fontStyle: 'bold',
    })
      .setOrigin(0.5)
    container.add(tableName)

    // Columns
    const columns = typeof table.columns[0] === 'string'
      ? (table.columns as string[])
      : (table.columns as TableColumn[]).map(c => `${c.name}: ${c.type}`)

    columns.forEach((col, i) => {
      const colText = this.add.text(0, -tableHeight / 2 + 50 + i * 25, col, {
        fontSize: '12px',
        color: '#bfdbfe',
      })
        .setOrigin(0.5)
      container.add(colText)
    })

    // Row count
    const rowCount = this.add.text(0, tableHeight / 2 - 15, `${table.rows} rows`, {
      fontSize: '11px',
      color: '#60a5fa',
      fontStyle: 'italic',
    })
      .setOrigin(0.5)
    container.add(rowCount)

    container.setScrollFactor(0)
    return container
  }

  private createQueryInterface(): void {
    const { centerX, centerY } = this.cameras.main
    const startY = centerY + 40

    // Question
    this.add.text(centerX, startY - 80, this.question, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 700 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)

    // Query options
    this.queryOptions.forEach((option, index) => {
      const y = startY + index * 70
      this.createQueryButton(option, centerX, y, index)
    })
  }

  private createQueryButton(option: QueryOption, x: number, y: number, index: number): void {
    const width = 600
    const height = 55

    const button = this.add.rectangle(x, y, width, height, 0x1e293b, 0.8)
      .setStrokeStyle(2, 0x475569)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)

    const queryText = this.add.text(x, y, option.query, {
      fontSize: '14px',
      color: '#cbd5e1',
      fontFamily: 'monospace',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)

    button.on('pointerover', () => {
      if (!this.submitted) {
        button.setStrokeStyle(2, 0x3b82f6)
        button.setFillStyle(0x1e40af, 0.6)
      }
    })

    button.on('pointerout', () => {
      if (!this.submitted && this.selectedQuery !== option.query) {
        button.setStrokeStyle(2, 0x475569)
        button.setFillStyle(0x1e293b, 0.8)
      }
    })

    button.on('pointerdown', () => {
      if (!this.submitted) {
        this.selectQuery(option.query, button, queryText)
      }
    })

    this.queryButtons.push(button)
  }

  private selectQuery(query: string, button: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text): void {
    // Deselect previous
    this.queryButtons.forEach(btn => {
      btn.setStrokeStyle(2, 0x475569)
      btn.setFillStyle(0x1e293b, 0.8)
    })

    // Select current
    this.selectedQuery = query
    button.setStrokeStyle(2, 0x10b981)
    button.setFillStyle(0x064e3b, 0.6)

    this.validateQuery(query)
    this.showFeedback()
  }

  private validateQuery(query: string): void {
    this.isCorrect = query === this.correctQuery
    this.submitted = true
  }

  private createUI(): void {
    const { centerX, height } = this.cameras.main

    // Feedback area (initially hidden)
    this.feedbackText = this.add.text(centerX, height - 120, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 600 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)

    // Hint button
    const hintButton = this.add.rectangle(centerX - 250, height - 60, 120, 40, 0x0891b2)
      .setStrokeStyle(2, 0x06b6d4)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)

    this.add.text(centerX - 250, height - 60, '💡 Hint', {
      fontSize: '14px',
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)

    hintButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.showHint()
      }
    })

    this.hintText = this.add.text(centerX, height - 180, '', {
      fontSize: '13px',
      color: '#67e8f9',
      align: 'center',
      wordWrap: { width: 600 },
      fontStyle: 'italic',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)

    // Submit button
    const submitButton = this.add.rectangle(centerX + 250, height - 60, 120, 40, 0x16a34a)
      .setStrokeStyle(2, 0x22c55e)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)

    this.add.text(centerX + 250, height - 60, '✓ Submit', {
      fontSize: '14px',
      color: '#ffffff',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)

    submitButton.on('pointerdown', () => {
      if (this.selectedQuery && !this.submitted) {
        this.completeChallenge()
      }
    })
  }

  private showHint(): void {
    if (this.hintsUsed >= 3) {
      this.hintText.setText('No more hints available!')
      this.hintText.setVisible(true)
      return
    }

    this.hintsUsed++
    const hints = [
      `💡 Hint 1: Look at the question carefully - what operation does it ask for?`,
      `💡 Hint 2: ${SQL_TIPS[Math.floor(Math.random() * SQL_TIPS.length)]}`,
      `💡 Hint 3: The correct query starts with: ${this.correctQuery.split(' ')[0]}...`,
    ]

    this.hintText.setText(hints[this.hintsUsed - 1])
    this.hintText.setVisible(true)

    // Penalty for using hints
    this.baseScore -= 10
  }

  private showFeedback(): void {
    if (!this.submitted) return

    this.animateQueryExecution()

    this.time.delayedCall(800, () => {
      const option = this.queryOptions.find(o => o.query === this.selectedQuery)

      if (this.isCorrect) {
        this.feedbackText.setText('✅ Correct! Query executed successfully.')
        this.feedbackText.setColor('#22c55e')
        this.highlightTable(this.selectedQuery || '')
        this.showDataFlow()
      } else {
        const explanation = option?.explanation || 'This query is incorrect. Try again!'
        this.feedbackText.setText(`❌ ${explanation}`)
        this.feedbackText.setColor('#ef4444')
      }

      this.feedbackText.setVisible(true)

      if (this.isCorrect) {
        this.time.delayedCall(1500, () => {
          this.completeChallenge()
        })
      }
    })
  }

  private animateQueryExecution(): void {
    // Flash effect to simulate query execution
    this.cameras.main.flash(300, 59, 130, 246, false)
  }

  private highlightTable(query: string): void {
    // Find which table is being queried
    const tableName = this.schema.tables.find(t =>
      query.toUpperCase().includes(t.name.toUpperCase())
    )?.name

    if (tableName) {
      const container = this.tableContainers[this.schema.tables.findIndex(t => t.name === tableName)]
      if (container) {
        this.tweens.add({
          targets: container,
          alpha: { from: 1, to: 0.3 },
          yoyo: true,
          duration: 200,
          repeat: 2,
        })
      }
    }
  }

  private showDataFlow(): void {
    // Animated data flow from table to result
    const graphics = this.add.graphics()
    graphics.setScrollFactor(0)

    let progress = 0
    const flow = this.time.addEvent({
      delay: 50,
      repeat: 20,
      callback: () => {
        graphics.clear()
        graphics.lineStyle(3, 0x3b82f6, 0.8)
        graphics.beginPath()
        graphics.arc(this.cameras.main.centerX, 300, 50 + progress * 5, 0, Math.PI * 2)
        graphics.strokePath()
        progress++
      },
    })

    this.time.delayedCall(1000, () => {
      flow.destroy()
      graphics.destroy()
    })
  }

  private calculateScore(): number {
    let score = this.baseScore
    score -= this.hintsUsed * 10
    return Math.max(score, 0)
  }

  private completeChallenge(): void {
    if (!this.isCorrect) return

    const finalScore = this.calculateScore()
    this.emitScore(finalScore, 'Database challenge completed')

    this.time.delayedCall(500, () => {
      this.completeLayer(finalScore)
    })
  }

  private resumeGame(): void {
    // Resume game logic if needed
  }

  shutdown(): void {
    EventBus.off('game:resume', this.resumeGame, this)
  }
}
