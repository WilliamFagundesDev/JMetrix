<template>
  <div class="jmx-logo-container" :class="[sizeClass, { 'is-animated': animated }]">
    <div class="logo-symbol-wrapper">
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="jmx-svg-icon"
      >
        <defs>
          <!-- Cyber Performance Gradient -->
          <linearGradient id="jmxGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00f0ff" />
            <stop offset="45%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#7c3aed" />
          </linearGradient>

          <linearGradient id="jmxGradAccent" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>

          <!-- Glow Filter -->
          <filter id="jmxGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="jmxLetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#e0f2fe" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>
        </defs>

        <!-- Outer Shield / Hexagonal Frame -->
        <path
          d="M60 6 L108 26 L108 80 L60 114 L12 80 L12 26 Z"
          fill="url(#jmxGradPrimary)"
          fill-opacity="0.12"
          stroke="url(#jmxGradPrimary)"
          stroke-width="3.5"
          stroke-linejoin="round"
        />

        <!-- Inner Pulse Horizon (Telemetry waves) -->
        <path
          d="M18 64 L36 64 L44 48 L54 82 L64 36 L74 68 L84 64 L102 64"
          stroke="url(#jmxGradAccent)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.35"
        />

        <!-- JMX Letters (Custom geometric paths for razor sharp rendering) -->
        <!-- Letter J -->
        <path
          d="M32 40 L40 40 L40 68 C40 76 34 80 26 80 C21 80 18 78 18 78 L20 71 C20 71 23 73 26 73 C29 73 31 71 31 67 L31 40 Z"
          fill="url(#jmxLetterGrad)"
          filter="url(#jmxGlow)"
        />

        <!-- Letter M -->
        <path
          d="M44 40 L53 40 L60 58 L67 40 L76 40 L76 80 L68 80 L68 53 L62 67 L58 67 L52 53 L52 80 L44 80 Z"
          fill="url(#jmxLetterGrad)"
          filter="url(#jmxGlow)"
        />

        <!-- Letter X -->
        <path
          d="M80 40 L88 40 L95 56 L102 40 L110 40 L99 60 L110 80 L102 80 L95 64 L88 80 L80 80 L91 60 Z"
          fill="url(#jmxLetterGrad)"
          filter="url(#jmxGlow)"
        />

        <!-- Glowing Nodes -->
        <circle cx="60" cy="114" r="3.5" fill="#00f0ff" filter="url(#jmxGlow)" />
        <circle cx="108" cy="26" r="3" fill="#38bdf8" />
        <circle cx="12" cy="26" r="3" fill="#7c3aed" />
      </svg>
    </div>

    <!-- Text Label (if withText is true) -->
    <div v-if="withText" class="logo-typography">
      <div class="brand-row">
        <span class="brand-title">JMETRIX</span>
        <span class="brand-badge font-mono">JMX</span>
      </div>
      <span class="brand-subtext">{{ subtitle || 'JMeter Engine • Observability' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md', // sm, md, lg, xl
    validator: v => ['sm', 'md', 'lg', 'xl'].includes(v)
  },
  withText: {
    type: Boolean,
    default: false
  },
  subtitle: {
    type: String,
    default: ''
  },
  animated: {
    type: Boolean,
    default: true
  }
});

const sizeClass = computed(() => `size-${props.size}`);
</script>

<style scoped>
.jmx-logo-container {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.logo-symbol-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.jmx-logo-container:hover .logo-symbol-wrapper {
  transform: scale(1.06);
}

/* Sizes */
.size-sm .jmx-svg-icon {
  width: 28px;
  height: 28px;
}
.size-md .jmx-svg-icon {
  width: 40px;
  height: 40px;
}
.size-lg .jmx-svg-icon {
  width: 54px;
  height: 54px;
}
.size-xl .jmx-svg-icon {
  width: 76px;
  height: 76px;
}

.jmx-svg-icon {
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0, 240, 255, 0.2));
  transition: filter 0.3s ease;
}

.jmx-logo-container:hover .jmx-svg-icon {
  filter: drop-shadow(0 4px 14px rgba(0, 240, 255, 0.45));
}

.logo-typography {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.brand-title {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.6px;
  background: linear-gradient(135deg, #00f0ff 0%, #2563eb 55%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.size-lg .brand-title {
  font-size: 22px;
}

.size-xl .brand-title {
  font-size: 28px;
}

.brand-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid rgba(0, 240, 255, 0.35);
  color: #00f0ff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.brand-subtext {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-top: 2px;
}

/* Animations */
.is-animated .jmx-svg-icon {
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
</style>
