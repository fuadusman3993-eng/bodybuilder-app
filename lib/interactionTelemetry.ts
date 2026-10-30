import { router } from 'expo-router';
import { captureSystemError } from './telemetryService';

/**
 * FitPulse Touch & Interaction Auto-Logger:
 * Detects dead buttons, broken routes, and action exceptions instantly when a user interacts with the app,
 * and streams the telemetry directly to the CEO Mission Control Dashboard.
 */
export function trackInteraction(
  pageName: string,
  buttonName: string,
  action?: () => void | Promise<void>,
  targetRoute?: string
) {
  // 1. Dead Button Detection: User pressed a button with no functional handler
  if (!action && !targetRoute) {
    const errorMsg = `ተጠቃሚው በ [${pageName}] ላይ [${buttonName}] ነክቶ አልሰራም (Dead Button / No Action Bound)`;
    console.warn(`[InteractionTelemetry] Dead button detected: "${buttonName}" on "${pageName}"`);
    captureSystemError(errorMsg, {
      component: pageName,
      severity: 'warning',
      metadata: { page: pageName, button: buttonName, type: 'dead_button' },
    });
    return;
  }

  // 2. Target Route Execution & Broken Route Detection
  if (targetRoute) {
    try {
      router.push(targetRoute as any);
    } catch (err: any) {
      const errorMsg = `ተጠቃሚው በ [${pageName}] ላይ ወደ [${targetRoute}] ለመሄድ [${buttonName}] ነክቶ አልሰራም (Broken Route)`;
      console.warn(`[InteractionTelemetry] Broken route detected: ${targetRoute}`, err);
      captureSystemError(errorMsg, {
        component: pageName,
        severity: 'critical',
        metadata: { page: pageName, button: buttonName, targetRoute, type: 'broken_route' },
      });
    }
  }

  // 3. Action Execution & Runtime Exception Detection
  if (action) {
    try {
      const res = action();
      if (res && typeof (res as any).catch === 'function') {
        (res as Promise<void>).catch((asyncErr) => {
          const errMsg = `ተጠቃሚው በ [${pageName}] ላይ [${buttonName}] ነክቶ አልሰራም (Action Crash): ${asyncErr?.message || asyncErr}`;
          console.warn(`[InteractionTelemetry] Async crash on "${buttonName}":`, asyncErr);
          captureSystemError(errMsg, {
            component: pageName,
            severity: 'critical',
            metadata: { page: pageName, button: buttonName, type: 'action_crash' },
          });
        });
      }
    } catch (syncErr: any) {
      const errMsg = `ተጠቃሚው በ [${pageName}] ላይ [${buttonName}] ነክቶ አልሰራም (Action Crash): ${syncErr?.message || syncErr}`;
      console.warn(`[InteractionTelemetry] Sync exception on "${buttonName}":`, syncErr);
      captureSystemError(errMsg, {
        component: pageName,
        severity: 'critical',
        metadata: { page: pageName, button: buttonName, type: 'action_crash' },
      });
    }
  }
}
