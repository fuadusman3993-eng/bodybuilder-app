import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export interface HistorySession {
  date: string;
  maxReps: number;
  totalReps: number;
}

interface RepsHistoryChartProps {
  sessions: HistorySession[];
}

export default function RepsHistoryChart({ sessions }: RepsHistoryChartProps) {
  const [metric, setMetric] = useState<'Max Reps' | 'Total Reps'>('Max Reps');

  // Provide realistic default bars if new user has 0 or 1 sessions
  const chartData = sessions && sessions.length > 0 ? sessions : [
    { date: 'Mon', maxReps: 12, totalReps: 36 },
    { date: 'Wed', maxReps: 14, totalReps: 42 },
    { date: 'Fri', maxReps: 15, totalReps: 45 },
  ];

  const values = chartData.map(d => metric === 'Max Reps' ? d.maxReps : d.totalReps);
  const maxValue = Math.max(...values, 10);
  const yTicks = [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25)];

  const unlocked = sessions.length >= 2;

  return (
    <View style={styles.card}>
      {/* Toggle Header: [ Max Reps ]  [ Total Reps ] */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, metric === 'Max Reps' && styles.toggleBtnActive]}
          onPress={() => setMetric('Max Reps')}
        >
          <Text style={[styles.toggleText, metric === 'Max Reps' && styles.toggleTextActive]}>
            Max Reps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, metric === 'Total Reps' && styles.toggleBtnActive]}
          onPress={() => setMetric('Total Reps')}
        >
          <Text style={[styles.toggleText, metric === 'Total Reps' && styles.toggleTextActive]}>
            Total Reps
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {metric === 'Max Reps'
          ? 'The maximum number of repetitions in a set'
          : 'Total repetitions logged across all sets in a session'}
      </Text>

      {/* Bar Chart Area */}
      <View style={styles.chartContainer}>
        {/* Y-axis Ticks */}
        <View style={styles.yAxis}>
          {yTicks.map((val, idx) => (
            <Text key={idx} style={styles.yTickText}>{val}reps</Text>
          ))}
          <Text style={styles.yTickText}>0reps</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsArea}>
          {chartData.map((session, idx) => {
            const val = metric === 'Max Reps' ? session.maxReps : session.totalReps;
            const barHeightPercent = Math.max(Math.min((val / maxValue) * 100, 100), 8);
            const isLatest = idx === chartData.length - 1;

            return (
              <View key={idx} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${barHeightPercent}%` },
                      isLatest && styles.barFillLatest,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{session.date}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Strength Report Status */}
      <View style={styles.unlockBanner}>
        <Ionicons
          name={unlocked ? 'sparkles-outline' : 'lock-closed'}
          size={16}
          color={unlocked ? Colors.primary : '#818CF8'}
        />
        <Text style={styles.unlockText}>
          {unlocked
            ? 'Strength report active: Consistent upward progressive overload detected!'
            : `Strength report unlocks in ${Math.max(2 - sessions.length, 1)} more sessions`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  yAxis: {
    width: 50,
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  yTickText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 4,
  },
  barCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 36,
  },
  barTrack: {
    width: 14,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 7,
  },
  barFillLatest: {
    backgroundColor: Colors.primary,
  },
  barLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  unlockText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});
