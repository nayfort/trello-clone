<template>
	<NuxtLayout>
		<NuxtRouteAnnouncer />
		<ClientOnly>
			<NuxtPage />
		</ClientOnly>
	</NuxtLayout>
</template>

<script lang="ts" setup>
useHead({
	title: 'Trello Clone',
});

const dashboardStore = useProjectsStore();
onMounted(() => dashboardStore.init());
</script>
