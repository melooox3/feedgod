import { NextResponse } from 'next/server'

const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const leagueId = searchParams.get('leagueId')
  const teamId = searchParams.get('teamId')
  const eventId = searchParams.get('eventId')
  const season = searchParams.get('season')
  const round = searchParams.get('round')

  try {
    let url: string

    switch (endpoint) {
      case 'next_events_league':
        // Next 15 events in a league
        url = `${THESPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`
        break
      
      case 'next_events_team':
        // Next 5 events by team
        url = `${THESPORTSDB_BASE}/eventsnext.php?id=${teamId}`
        break
      
      case 'events_round':
        // Events by round
        url = `${THESPORTSDB_BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${season}`
        break
      
      case 'event_details':
        // Single event details
        url = `${THESPORTSDB_BASE}/lookupevent.php?id=${eventId}`
        break
      
      case 'league_details':
        // League info
        url = `${THESPORTSDB_BASE}/lookupleague.php?id=${leagueId}`
        break
      
      case 'teams_in_league':
        // All teams in a league
        url = `${THESPORTSDB_BASE}/lookup_all_teams.php?id=${leagueId}`
        break
      
      case 'past_events_league':
        // Past events (last 15)
        url = `${THESPORTSDB_BASE}/eventspastleague.php?id=${leagueId}`
        break

      case 'live_events':
        // Live events (for leagues with live scores)
        url = `${THESPORTSDB_BASE}/livescore.php?s=Soccer`
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        )
    }

    console.log('[Sports API] Fetching:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error('[Sports API] Error:', response.status)
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Sports API] Response received, events:', data.events?.length || 0)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[Sports API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sports data' },
      { status: 500 }
    )
  }
}

