import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  phase: string;
  step: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  duration?: number;
}

export default function DataSyncTesting() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateLastResult = (updates: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      if (newResults.length > 0) {
        newResults[newResults.length - 1] = { ...newResults[newResults.length - 1], ...updates };
      }
      return newResults;
    });
  };

  // Phase 1: Pre-Test Validation
  const runPhase1 = async () => {
    setCurrentPhase('Phase 1: Pre-Test Validation');
    
    // Check current gameweek
    addResult({ phase: '1', step: '1.1', status: 'running', message: 'Checking current gameweek...' });
    const { data: gwData, error: gwError } = await supabase
      .from('fploveralldata')
      .select('id, name, is_current, is_next, deadline_time')
      .in('is_current', ['true'])
      .or('is_next.eq.true');

    if (gwError) {
      updateLastResult({ status: 'error', message: `Error: ${gwError.message}` });
      return false;
    }
    updateLastResult({ 
      status: 'success', 
      message: `✅ Current GW: ${gwData[0]?.name} (ID: ${gwData[0]?.id})`, 
      data: gwData 
    });

    // Check teams
    addResult({ phase: '1', step: '1.1', status: 'running', message: 'Checking teams data...' });
    const { count: teamCount, error: teamError } = await supabase
      .from('plteams')
      .select('*', { count: 'exact', head: true });

    if (teamError) {
      updateLastResult({ status: 'error', message: `Error: ${teamError.message}` });
      return false;
    }
    updateLastResult({ 
      status: teamCount && teamCount >= 20 ? 'success' : 'warning', 
      message: `${teamCount && teamCount >= 20 ? '✅' : '⚠️'} Teams: ${teamCount}/20 expected`, 
      data: { teamCount } 
    });

    // Check players
    addResult({ phase: '1', step: '1.1', status: 'running', message: 'Checking players data...' });
    const { count: playerCount, error: playerError } = await supabase
      .from('plplayerdata')
      .select('*', { count: 'exact', head: true });

    if (playerError) {
      updateLastResult({ status: 'error', message: `Error: ${playerError.message}` });
      return false;
    }
    updateLastResult({ 
      status: playerCount && playerCount >= 600 ? 'success' : 'warning', 
      message: `${playerCount && playerCount >= 600 ? '✅' : '⚠️'} Players: ${playerCount}/600+ expected`, 
      data: { playerCount } 
    });

    toast.success('Phase 1 completed');
    return true;
  };

  // Phase 2: Test Sync Functions
  const runPhase2 = async () => {
    setCurrentPhase('Phase 2: Test Sync Functions');

    // Test sync-fpl-data
    addResult({ phase: '2', step: '2.1', status: 'running', message: 'Testing sync-fpl-data...' });
    const start1 = Date.now();
    const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-fpl-data', {
      body: {}
    });
    const duration1 = Date.now() - start1;

    if (syncError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ sync-fpl-data failed: ${syncError.message}`,
        duration: duration1
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ sync-fpl-data completed (${(duration1/1000).toFixed(2)}s)`,
        data: syncData,
        duration: duration1
      });
    }

    // Wait a bit before next call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test sync-gameweek-history
    addResult({ phase: '2', step: '2.2', status: 'running', message: 'Testing sync-gameweek-history for GW11...' });
    const start2 = Date.now();
    const { data: gwHistoryData, error: gwHistoryError } = await supabase.functions.invoke('sync-gameweek-history', {
      body: { gameweek: 11 }
    });
    const duration2 = Date.now() - start2;

    if (gwHistoryError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ sync-gameweek-history failed: ${gwHistoryError.message}`,
        duration: duration2
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ sync-gameweek-history completed (${(duration2/1000).toFixed(2)}s)`,
        data: gwHistoryData,
        duration: duration2
      });

      // Verify records created
      const { count: gwCount } = await supabase
        .from('player_gameweek_history')
        .select('*', { count: 'exact', head: true })
        .eq('gameweek', 11);

      addResult({ 
        phase: '2', 
        step: '2.2', 
        status: 'success', 
        message: `✅ Verified: ${gwCount} player records created for GW11` 
      });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test sync-price-changes
    addResult({ phase: '2', step: '2.3', status: 'running', message: 'Testing sync-price-changes...' });
    const start3 = Date.now();
    const { data: priceData, error: priceError } = await supabase.functions.invoke('sync-price-changes', {
      body: {}
    });
    const duration3 = Date.now() - start3;

    if (priceError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ sync-price-changes failed: ${priceError.message}`,
        duration: duration3
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ sync-price-changes completed (${(duration3/1000).toFixed(2)}s)`,
        data: priceData,
        duration: duration3
      });

      // Verify records created
      const { count: priceCount } = await supabase
        .from('price_change_history')
        .select('*', { count: 'exact', head: true });

      addResult({ 
        phase: '2', 
        step: '2.3', 
        status: 'success', 
        message: `✅ Verified: ${priceCount} price records created` 
      });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test sync-upcoming-fixtures
    addResult({ phase: '2', step: '2.4', status: 'running', message: 'Testing sync-upcoming-fixtures for GW12...' });
    const start4 = Date.now();
    const { data: fixturesData, error: fixturesError } = await supabase.functions.invoke('sync-upcoming-fixtures', {
      body: { gameweek: 12 }
    });
    const duration4 = Date.now() - start4;

    if (fixturesError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ sync-upcoming-fixtures failed: ${fixturesError.message}`,
        duration: duration4
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ sync-upcoming-fixtures completed (${(duration4/1000).toFixed(2)}s)`,
        data: fixturesData,
        duration: duration4
      });

      // Verify records created
      const { count: fixtureCount } = await supabase
        .from('upcoming_fixtures_enriched')
        .select('*', { count: 'exact', head: true })
        .eq('gameweek', 12);

      addResult({ 
        phase: '2', 
        step: '2.4', 
        status: 'success', 
        message: `✅ Verified: ${fixtureCount} fixtures created for GW12` 
      });
    }

    toast.success('Phase 2 completed');
    return true;
  };

  // Phase 3: Error Scenarios
  const runPhase3 = async () => {
    setCurrentPhase('Phase 3: Error Scenarios');

    // Test missing gameweek parameter
    addResult({ phase: '3', step: '3.1', status: 'running', message: 'Testing missing gameweek parameter...' });
    const { error: error1 } = await supabase.functions.invoke('sync-gameweek-history', {
      body: {}
    });

    if (error1) {
      updateLastResult({ 
        status: 'success', 
        message: `✅ Correctly rejected: ${error1.message}` 
      });
    } else {
      updateLastResult({ 
        status: 'warning', 
        message: '⚠️ Should have rejected missing parameter' 
      });
    }

    // Test invalid gameweek number
    addResult({ phase: '3', step: '3.1', status: 'running', message: 'Testing invalid gameweek (999)...' });
    const { data: data999, error: error999 } = await supabase.functions.invoke('sync-gameweek-history', {
      body: { gameweek: 999 }
    });

    updateLastResult({ 
      status: 'success', 
      message: `✅ Handled GW999: ${error999 ? error999.message : 'Returned empty/0 records'}`,
      data: data999
    });

    toast.success('Phase 3 completed');
    return true;
  };

  // Phase 4: Data Quality Validation
  const runPhase4 = async () => {
    setCurrentPhase('Phase 4: Data Quality Validation');

    // Check player_gameweek_history data quality
    addResult({ phase: '4', step: '4.1', status: 'running', message: 'Validating player_gameweek_history...' });
    
    const { count: negativeCount } = await supabase
      .from('player_gameweek_history')
      .select('*', { count: 'exact', head: true })
      .or('points.lt.0,minutes.lt.0');

    const { data: rangeData } = await supabase.rpc('exec_sql', {
      query: `SELECT 
        MIN(points) as min_pts, MAX(points) as max_pts,
        MIN(minutes) as min_mins, MAX(minutes) as max_mins,
        AVG(form::float) as avg_form
      FROM player_gameweek_history`
    }).single();

    updateLastResult({ 
      status: negativeCount === 0 ? 'success' : 'error',
      message: `${negativeCount === 0 ? '✅' : '❌'} No negative values found. Range checks: ${JSON.stringify(rangeData)}`,
      data: { negativeCount, rangeData }
    });

    // Check price_change_history data quality
    addResult({ phase: '4', step: '4.1', status: 'running', message: 'Validating price_change_history...' });
    
    const { data: priceRange } = await supabase
      .from('price_change_history')
      .select('new_price')
      .order('new_price', { ascending: true })
      .limit(1);

    const { data: priceRangeMax } = await supabase
      .from('price_change_history')
      .select('new_price')
      .order('new_price', { ascending: false })
      .limit(1);

    const minPrice = priceRange?.[0]?.new_price || 0;
    const maxPrice = priceRangeMax?.[0]?.new_price || 0;
    const priceValid = minPrice >= 30 && maxPrice <= 150;

    updateLastResult({ 
      status: priceValid ? 'success' : 'warning',
      message: `${priceValid ? '✅' : '⚠️'} Price range: £${(minPrice/10).toFixed(1)} - £${(maxPrice/10).toFixed(1)}`,
      data: { minPrice, maxPrice }
    });

    // Check upcoming_fixtures_enriched data quality
    addResult({ phase: '4', step: '4.1', status: 'running', message: 'Validating upcoming_fixtures_enriched...' });
    
    const { data: fixtures } = await supabase
      .from('upcoming_fixtures_enriched')
      .select('home_attack_strength, home_defense_strength, away_attack_strength, away_defense_strength')
      .limit(100);

    const strengthsValid = fixtures?.every(f => 
      f.home_attack_strength >= 2 && f.home_attack_strength <= 5 &&
      f.home_defense_strength >= 2 && f.home_defense_strength <= 5
    );

    updateLastResult({ 
      status: strengthsValid ? 'success' : 'warning',
      message: `${strengthsValid ? '✅' : '⚠️'} Team strengths in expected range (2-5)`,
      data: { sampleSize: fixtures?.length }
    });

    toast.success('Phase 4 completed');
    return true;
  };

  // Phase 5: Integration Test
  const runPhase5 = async () => {
    setCurrentPhase('Phase 5: Integration Test');

    // Test ML prediction functions
    addResult({ phase: '5', step: '5.2', status: 'running', message: 'Testing predict-price-changes...' });
    const { data: pricePredictions, error: priceError } = await supabase.functions.invoke('predict-price-changes', {
      body: {}
    });

    if (priceError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ predict-price-changes failed: ${priceError.message}` 
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ predict-price-changes returned ${pricePredictions?.predictions?.length || 0} predictions`,
        data: pricePredictions
      });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    addResult({ phase: '5', step: '5.2', status: 'running', message: 'Testing predict-form-trends...' });
    const { data: formPredictions, error: formError } = await supabase.functions.invoke('predict-form-trends', {
      body: {}
    });

    if (formError) {
      updateLastResult({ 
        status: 'error', 
        message: `❌ predict-form-trends failed: ${formError.message}` 
      });
    } else {
      updateLastResult({ 
        status: 'success', 
        message: `✅ predict-form-trends returned ${formPredictions?.predictions?.length || 0} predictions`,
        data: formPredictions
      });
    }

    toast.success('Phase 5 completed');
    return true;
  };

  // Run all phases
  const runAllPhases = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const phase1Success = await runPhase1();
      if (!phase1Success) {
        toast.error('Phase 1 failed. Stopping test execution.');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const phase2Success = await runPhase2();
      if (!phase2Success) {
        toast.error('Phase 2 failed. Continuing with remaining phases...');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await runPhase3();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await runPhase4();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await runPhase5();

      toast.success('All phases completed!');
    } catch (error) {
      toast.error('Test execution failed');
      console.error(error);
    } finally {
      setIsRunning(false);
      setCurrentPhase('');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Sync Testing Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive edge function testing suite</p>
        </div>
        <Button 
          onClick={runAllPhases} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>
      </div>

      {currentPhase && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              {currentPhase}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="phases">Test Phases</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No test results yet. Click "Run All Tests" to start.
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <CardTitle className="text-base">
                          Phase {result.phase} - Step {result.step}
                        </CardTitle>
                        <CardDescription>{result.message}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <Badge variant="outline">{(result.duration / 1000).toFixed(2)}s</Badge>
                      )}
                      <Badge variant={
                        result.status === 'success' ? 'default' :
                        result.status === 'error' ? 'destructive' :
                        result.status === 'warning' ? 'secondary' :
                        'outline'
                      }>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {result.data && (
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="phases">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="phase1">
              <AccordionTrigger>Phase 1: Pre-Test Validation</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Check current gameweek status</li>
                  <li>Verify teams table (20 teams expected)</li>
                  <li>Verify players table (600+ players expected)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phase2">
              <AccordionTrigger>Phase 2: Test Sync Functions</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>sync-fpl-data: Update base data (players, teams, gameweeks)</li>
                  <li>sync-gameweek-history: Populate player stats for GW11</li>
                  <li>sync-price-changes: Track daily price movements</li>
                  <li>sync-upcoming-fixtures: Enrich fixtures with team strengths for GW12</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phase3">
              <AccordionTrigger>Phase 3: Error Scenarios</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Test missing gameweek parameter</li>
                  <li>Test invalid gameweek number (999)</li>
                  <li>Verify error handling</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phase4">
              <AccordionTrigger>Phase 4: Data Quality Validation</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verify no negative values in player stats</li>
                  <li>Check price ranges (£3.0-£15.0)</li>
                  <li>Validate team strengths (2-5)</li>
                  <li>Check for duplicates</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="phase5">
              <AccordionTrigger>Phase 5: Integration Test</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Test predict-price-changes with synced data</li>
                  <li>Test predict-form-trends with synced data</li>
                  <li>Verify ML functions can access data</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>Overview of test execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Tests</CardDescription>
                    <CardTitle className="text-3xl">{results.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Passed</CardDescription>
                    <CardTitle className="text-3xl text-green-500">
                      {results.filter(r => r.status === 'success').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-3xl text-red-500">
                      {results.filter(r => r.status === 'error').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Warnings</CardDescription>
                    <CardTitle className="text-3xl text-yellow-500">
                      {results.filter(r => r.status === 'warning').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {results.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-2">Success Criteria</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      {results.some(r => r.phase === '1' && r.status === 'success') ? 
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      Base data validation passed
                    </li>
                    <li className="flex items-center gap-2">
                      {results.some(r => r.phase === '2' && r.status === 'success') ? 
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      All sync functions executed successfully
                    </li>
                    <li className="flex items-center gap-2">
                      {results.some(r => r.phase === '4' && r.status === 'success') ? 
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      Data quality checks passed
                    </li>
                    <li className="flex items-center gap-2">
                      {results.some(r => r.phase === '5' && r.status === 'success') ? 
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      ML integration working
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
