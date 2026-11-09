<template>
  <div class="app-layout">
    <!-- Collapsible Sidebar -->
    <Sidebar />

    <!-- Main Content Container -->
    <div class="app-main">
      <Navbar />

      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Global Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import Sidebar from './components/common/Sidebar.vue';
import Navbar from './components/common/Navbar.vue';
import ToastContainer from './components/common/ToastContainer.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary);
  overflow-x: hidden;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
}

.page-content {
  flex: 1;
  padding: 24px 28px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}
</style>

