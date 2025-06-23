<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
});
</script>

<style>
/* Global styles for your app */
body {
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
  background-color: #f0f0f0;
}
</style>