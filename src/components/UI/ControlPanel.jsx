import React from 'react';
import useSimulationStore from '../../systems/SimulationStore';

const panelStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 320,
  background: 'rgba(10, 10, 20, 0.88)',
  borderRadius: 12,
  padding: 20,
  color: '#e0e0e0',
  fontFamily: "'Segoe UI', Tahoma, sans-serif",
  fontSize: 13,
  zIndex: 1000,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  userSelect: 'none',
};

const headerStyle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#ffffff',
};

const sectionStyle = {
  marginBottom: 14,
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const labelStyle = {
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6,
};

const buttonStyle = (active) => ({
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 12,
  transition: 'all 0.2s',
  background: active ? '#3b82f6' : 'rgba(255,255,255,0.08)',
  color: active ? '#fff' : '#aaa',
});

const speedBtnStyle = (active) => ({
  padding: '4px 10px',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  background: active ? '#10b981' : 'rgba(255,255,255,0.06)',
  color: active ? '#fff' : '#888',
});

const statRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '3px 0',
  fontSize: 12,
};

const lightIndicator = (color) => ({
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : color === 'red' ? '#ef4444' : '#444',
  boxShadow: color !== 'off' ? `0 0 6px ${color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : '#ef4444'}` : 'none',
  marginRight: 6,
});

export default function ControlPanel() {
  const mode = useSimulationStore((s) => s.mode);
  const setMode = useSimulationStore((s) => s.setMode);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const setSimulationSpeed = useSimulationStore((s) => s.setSimulationSpeed);
  const paused = useSimulationStore((s) => s.paused);
  const setPaused = useSimulationStore((s) => s.setPaused);
  const lightStates = useSimulationStore((s) => s.trafficLightStates);
  const stats = useSimulationStore((s) => s.stats);
  const currentPhase = useSimulationStore((s) => s.currentPhase);
  const elapsedTime = useSimulationStore((s) => s.elapsedTime);

  const formatTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const pedestrianSignals = useSimulationStore((s) => s.pedestrianSignals);
  const pedestrianCountdowns = useSimulationStore((s) => s.pedestrianCountdowns);

  const formatPhaseName = (phase) => {
    switch (phase) {
      case 'ns-left': return 'North-South Protected Left';
      case 'ns-through': return 'North-South Through & Right';
      case 'ew-left': return 'East-West Protected Left';
      case 'ew-through': return 'East-West Through & Right';
      default: return phase || 'Clearing';
    }
  };

  const simulationMode = useSimulationStore((s) => s.simulationMode);
  const setSimulationMode = useSimulationStore((s) => s.setSimulationMode);
  const vehicleIntensity = useSimulationStore((s) => s.vehicleIntensity);
  const setVehicleIntensity = useSimulationStore((s) => s.setVehicleIntensity);
  const pedestrianIntensity = useSimulationStore((s) => s.pedestrianIntensity);
  const setPedestrianIntensity = useSimulationStore((s) => s.setPedestrianIntensity);
  const selectedVehicleId = useSimulationStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useSimulationStore((s) => s.setSelectedVehicleId);
  const vehicles = useSimulationStore((s) => s.vehicles);
  const antiGridlockActive = useSimulationStore((s) => s.antiGridlockActive);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 20 }}>🚦</span>
        AI Smart Intersection (3-Lane)
      </div>

      {/* Mode toggle */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Signal Controller Mode</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={buttonStyle(mode === 'traditional')}
            onClick={() => setMode('traditional')}
          >
            ⏱ Fixed Interval
          </button>
          <button
            style={buttonStyle(mode === 'ai')}
            onClick={() => setMode('ai')}
          >
            🤖 AI Max-Pressure
          </button>
        </div>
      </div>

      {/* Simulation controls */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Simulation Speed & Clock</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            style={{
              ...speedBtnStyle(false),
              background: paused ? '#ef4444' : 'rgba(255,255,255,0.06)',
              color: paused ? '#fff' : '#888',
            }}
            onClick={() => setPaused(!paused)}
          >
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              style={speedBtnStyle(simulationSpeed === speed)}
              onClick={() => setSimulationSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
          Elapsed Time: {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Simulation Scenario Modes */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Simulation Scenario Mode</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 'custom', label: '⚙️ Custom Config', desc: 'Custom intensity adjustment' },
            { id: 'low_power', label: '⚡ Low Power (AI Demo)', desc: '1-2 cars; shows fixed wait vs instant AI green' },
            { id: 'pedestrian_rush', label: '🚶 Too Much Pedestrian', desc: 'High crowd priority crossing' },
            { id: 'asymmetric_rush', label: '🚗 Heavy Commuter Rush', desc: 'E-W jammed; AI clears platoons' },
            { id: 'emergency', label: '🚑 Emergency Priority (Ambulance)', desc: 'Spawns 1-2 ambulances; instant AI green pass' },
          ].map((scen) => (
            <button
              key={scen.id}
              onClick={() => setSimulationMode(scen.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '6px 10px',
                borderRadius: 6,
                border: simulationMode === scen.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                background: simulationMode === scen.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                color: simulationMode === scen.id ? '#ffffff' : '#aaaaaa',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>{scen.label}</span>
              <span style={{ fontSize: 10, color: '#777', marginTop: 1 }}>{scen.desc}</span>
            </button>
          ))}
        </div>

        {simulationMode === 'low_power' && (
          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', borderLeft: '3px solid #3b82f6', fontSize: 10, color: '#93c5fd' }}>
            💡 <b>Demo Focus:</b> Lone car waits up to ~45s in Fixed mode vs ~1.8s instant green in AI mode!
          </div>
        )}
        {simulationMode === 'asymmetric_rush' && (
          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', borderLeft: '3px solid #f59e0b', fontSize: 10, color: '#fde68a' }}>
            💡 <b>Demo Focus:</b> Heavy East-West platoons get extended green waves to clear queues with minimal delay!
          </div>
        )}
        {simulationMode === 'pedestrian_rush' && (
          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 4, background: 'rgba(139, 92, 246, 0.15)', borderLeft: '3px solid #8b5cf6', fontSize: 10, color: '#ddd6fe' }}>
            💡 <b>Demo Focus:</b> Dense commuter clusters cross safely; AI holds clearance until zebra lines clear!
          </div>
        )}
        {simulationMode === 'emergency' && (
          <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444', fontSize: 10, color: '#fca5a5' }}>
            💡 <b>Demo Focus:</b> AI immediately preempts opposing traffic to provide a clear green corridor for ambulances!
          </div>
        )}

        {/* Quick action: Dispatch Ambulance button */}
        <button
          onClick={() => useSimulationStore.getState().dispatchAmbulance()}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '7px 12px',
            background: 'linear-gradient(90deg, #dc2626, #2563eb)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6,
            color: '#fff',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'transform 0.1s',
          }}
        >
          <span>🚨</span>
          <span>Dispatch Ambulance Now</span>
        </button>
      </div>

      {/* Traffic Intensity Controls */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Traffic Intensities</div>
        
        {/* Vehicle Intensity */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#ccc', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>🚗 Vehicle Volume:</span>
            <b style={{ color: '#f59e0b', textTransform: 'capitalize' }}>{vehicleIntensity}</b>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {['low', 'mid', 'high', 'extreme'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setVehicleIntensity(lvl);
                  if (simulationMode !== 'custom') setSimulationMode('custom');
                }}
                style={{
                  padding: '3px 0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: vehicleIntensity === lvl ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                  color: vehicleIntensity === lvl ? '#000' : '#888',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Pedestrian Intensity */}
        <div>
          <div style={{ fontSize: 11, color: '#ccc', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>🚶 Pedestrian Volume:</span>
            <b style={{ color: '#8b5cf6', textTransform: 'capitalize' }}>{pedestrianIntensity}</b>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {['low', 'mid', 'high', 'extreme'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setPedestrianIntensity(lvl);
                  if (simulationMode !== 'custom') setSimulationMode('custom');
                }}
                style={{
                  padding: '3px 0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: pedestrianIntensity === lvl ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                  color: pedestrianIntensity === lvl ? '#fff' : '#888',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Vehicle Inspector */}
      {selectedVehicle && (
        <div style={{ ...sectionStyle, background: 'rgba(239, 68, 68, 0.12)', padding: 10, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
              🚗 Selected Vehicle Inspector
            </span>
            <button
              onClick={() => setSelectedVehicleId(null)}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 11 }}
            >
              ✕ Close
            </button>
          </div>
          <div style={statRowStyle}>
            <span>Type:</span>
            <b style={{ textTransform: 'capitalize' }}>{selectedVehicle.type}</b>
          </div>
          <div style={statRowStyle}>
            <span>Approach Direction:</span>
            <b style={{ textTransform: 'capitalize' }}>{selectedVehicle.direction}</b>
          </div>
          <div style={statRowStyle}>
            <span>Lane / Turn:</span>
            <b>Lane {selectedVehicle.laneIndex} ({selectedVehicle.turn})</b>
          </div>
          <div style={statRowStyle}>
            <span>Current Wait Time:</span>
            <b style={{ color: '#ef4444', fontSize: 13 }}>⏱ {selectedVehicle.waitTime.toFixed(1)}s</b>
          </div>
          <div style={statRowStyle}>
            <span>Status:</span>
            <b style={{ color: selectedVehicle.waiting ? '#f59e0b' : '#10b981' }}>
              {selectedVehicle.waiting ? 'Stopped at Signal' : 'Cruising'}
            </b>
          </div>
        </div>
      )}

      {/* Traffic light & Pedestrian status */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={labelStyle}>Horizontal Signals</span>
          <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>
            {formatPhaseName(currentPhase)}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['north', 'south', 'east', 'west'].map((dir) => {
            const sig = lightStates[dir] || { through: 'red', left: 'red' };
            const ped = pedestrianSignals[dir] || 'stop';
            const count = pedestrianCountdowns[dir] || 0;
            return (
              <div
                key={dir}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <span style={{ width: 44, fontWeight: 600, textTransform: 'capitalize' }}>{dir}</span>
                {/* Left turn arrow */}
                <span title="Left Turn Arrow" style={{ display: 'flex', alignItems: 'center', marginRight: 6 }}>
                  <span style={lightIndicator(sig.left)} />
                  <span style={{ fontSize: 10, color: '#aaa' }}>↰</span>
                </span>
                {/* Through signal (Green Allowance) */}
                <span title="Through Signal (Allowance)" style={{ display: 'flex', alignItems: 'center', marginRight: 6 }}>
                  <span style={lightIndicator(sig.through)} />
                  <span style={{ fontSize: 10, color: '#aaa' }}>↑</span>
                </span>
                {/* Right turn arrow */}
                <span title="Right Turn Arrow" style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
                  <span style={lightIndicator(sig.right || (sig.through === 'green' ? 'green' : sig.through === 'yellow' ? 'yellow' : 'red'))} />
                  <span style={{ fontSize: 10, color: '#aaa' }}>↱</span>
                </span>
                {/* Pedestrian Indicator */}
                <div
                  title="Pedestrian Crosswalk Signal"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background:
                      ped === 'walk'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : ped === 'flashing'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(239, 68, 68, 0.1)',
                    color:
                      ped === 'walk'
                        ? '#22c55e'
                        : ped === 'flashing'
                        ? '#eab308'
                        : '#ef4444',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <span>{ped === 'walk' ? '🚶 WALK' : ped === 'flashing' ? '✋ WAIT' : '✋ STOP'}</span>
                  {count > 0 && <span style={{ fontSize: 10, opacity: 0.85 }}>({count}s)</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Emergency Vehicle Preemption Active Banner */}
        {stats.emergencyPreemption && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(220, 38, 38, 0.2)',
              border: '1px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#fca5a5',
            }}
          >
            <span>🚨</span>
            <span>AI Emergency Preemption: Holding Green Wave</span>
          </div>
        )}

        {/* Anti-Gridlock Collision Prevention Active Banner */}
        {antiGridlockActive && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#6ee7b7',
            }}
          >
            <span>🛡️</span>
            <span>Collision Prevention: Clearing Trapped Gridlock</span>
          </div>
        )}
      </div>

      {/* Waiting counts */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Intersection Queues</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {['north', 'south', 'east', 'west'].map((dir) => (
            <div
              key={dir}
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '4px 6px',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>{dir}</span>
              <span>
                🚗 <b style={{ color: '#f59e0b' }}>{stats.vehiclesWaiting?.[dir] || 0}</b> &nbsp;
                🚶 <b style={{ color: '#8b5cf6' }}>{stats.pedestriansWaiting?.[dir] || 0}</b>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis metrics */}
      {mode === 'ai' && (
        <div style={{ ...sectionStyle, borderBottom: 'none', marginBottom: 0 }}>
          <div style={labelStyle}>AI Real-Time Optimization</div>
          <div style={statRowStyle}>
            <span>N-S Demand Urgency</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {(stats.aiScores?.ns || 0).toFixed(1)}
            </span>
          </div>
          <div style={statRowStyle}>
            <span>E-W Demand Urgency</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {(stats.aiScores?.ew || 0).toFixed(1)}
            </span>
          </div>
          <div style={statRowStyle}>
            <span>Active Mid-Crossing</span>
            <span style={{ color: stats.activePedestriansCrossing > 0 ? '#10b981' : '#6b7280', fontWeight: 600 }}>
              {stats.activePedestriansCrossing > 0
                ? `🛡️ ${stats.activePedestriansCrossing} Pedestrians (Holding Light)`
                : 'None (Safe)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
