import 'dotenv/config'
import { db } from '../lib/db'
import { slopesData, skiResorts } from '../lib/schema'
import { eq } from 'drizzle-orm'

async function seedTestData() {
  console.log('🌱 Seeding test data...')

  try {
    // Récupérer Valmeinier - Only select id and name needed
    const valmeinierResort = await db
      .select({ id: skiResorts.id, name: skiResorts.name })
      .from(skiResorts)
      .where(eq(skiResorts.name, 'Valmeinier'))
      .limit(1)

    if (valmeinierResort.length === 0) {
      console.error('❌ Station Valmeinier non trouvée. Créez-la d\'abord.')
      return
    }

    const resortId = valmeinierResort[0].id
    console.log(`✅ Station trouvée: ${valmeinierResort[0].name} (ID: ${resortId})`)

    // Scénarios de test
    const testScenarios = [
      {
        name: '0% - Domaine Fermé',
        openSlopes: 0,
        totalSlopes: 60,
        greenSlopes: { total: 15, open: 0 },
        blueSlopes: { total: 20, open: 0 },
        redSlopes: { total: 18, open: 0 },
        blackSlopes: { total: 7, open: 0 },
        hoursAgo: 5
      },
      {
        name: '15% - Ouverture Critique (<25%)',
        openSlopes: 9,
        totalSlopes: 60,
        greenSlopes: { total: 15, open: 5 },
        blueSlopes: { total: 20, open: 3 },
        redSlopes: { total: 18, open: 1 },
        blackSlopes: { total: 7, open: 0 },
        hoursAgo: 4
      },
      {
        name: '40% - Ouverture Partielle (25-50%)',
        openSlopes: 24,
        totalSlopes: 60,
        greenSlopes: { total: 15, open: 10 },
        blueSlopes: { total: 20, open: 8 },
        redSlopes: { total: 18, open: 5 },
        blackSlopes: { total: 7, open: 1 },
        hoursAgo: 3
      },
      {
        name: '65% - Bonne Ouverture (50-75%)',
        openSlopes: 39,
        totalSlopes: 60,
        greenSlopes: { total: 15, open: 12 },
        blueSlopes: { total: 20, open: 15 },
        redSlopes: { total: 18, open: 10 },
        blackSlopes: { total: 7, open: 2 },
        hoursAgo: 2
      },
      {
        name: '90% - Excellent Enneigement (>75%)',
        openSlopes: 54,
        totalSlopes: 60,
        greenSlopes: { total: 15, open: 15 },
        blueSlopes: { total: 20, open: 18 },
        redSlopes: { total: 18, open: 15 },
        blackSlopes: { total: 7, open: 6 },
        hoursAgo: 1
      },
    ]

    // Insérer les données de test
    for (const scenario of testScenarios) {
      const scrapedAt = new Date()
      scrapedAt.setHours(scrapedAt.getHours() - scenario.hoursAgo)

      await db.insert(slopesData).values({
        resortId,
        scrapedAt,
        date: scrapedAt,
        totalSlopes: scenario.totalSlopes,
        openSlopes: scenario.openSlopes,
        closedSlopes: scenario.totalSlopes - scenario.openSlopes,
        greenSlopes: scenario.greenSlopes,
        blueSlopes: scenario.blueSlopes,
        redSlopes: scenario.redSlopes,
        blackSlopes: scenario.blackSlopes,
        success: true,
        rawData: {
          testScenario: scenario.name,
          percentage: Math.round((scenario.openSlopes / scenario.totalSlopes) * 100)
        }
      })

      console.log(`✅ ${scenario.name} - ${Math.round((scenario.openSlopes / scenario.totalSlopes) * 100)}%`)
    }

    console.log('\n🎉 Données de test ajoutées avec succès!')
    console.log('\n📊 Tu peux maintenant utiliser le sélecteur de date pour voir les différents scénarios:')
    console.log('   - Domaine Fermé (0%)')
    console.log('   - Ouverture Critique (15%)')
    console.log('   - Ouverture Partielle (40%)')
    console.log('   - Bonne Ouverture (65%)')
    console.log('   - Excellent Enneigement (90%)')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

seedTestData()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script échoué:', error)
    process.exit(1)
  })
