import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Circle, Marker, Callout } from 'react-native-maps';

const DEFAULT_REGION = {
  latitude: 18.5204,
  longitude: 73.8567,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function HeatmapView({ points, onClusterPress }) {
  if (!points || points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyText}>No complaints found for the selected filters.</Text>
      </View>
    );
  }

  return (
    <MapView style={styles.map} initialRegion={DEFAULT_REGION} showsUserLocation>
      {points.map((pt, i) => (
        <React.Fragment key={`${pt.latitude}_${pt.longitude}_${i}`}>
          <Circle
            center={{ latitude: pt.latitude, longitude: pt.longitude }}
            radius={pt.radius}
            fillColor={pt.fillColor}
            strokeColor={pt.strokeColor}
            strokeWidth={1}
          />
          <Marker
            coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
            opacity={0}
            onPress={() => onClusterPress?.({ count: pt.count, topCategory: pt.topCategory, latitude: pt.latitude, longitude: pt.longitude })}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutCount}>{pt.count} complaint{pt.count !== 1 ? 's' : ''}</Text>
                <Text style={styles.calloutCat}>{pt.topCategory.replace(/_/g, ' ')}</Text>
              </View>
            </Callout>
          </Marker>
        </React.Fragment>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  callout: { padding: 10, minWidth: 140 },
  calloutCount: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  calloutCat: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
});
