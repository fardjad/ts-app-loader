export function Home() {
	return (
		<div class="home">
			<h1>Get Started building Preact Apps</h1>
			<section>
				<Resource
					title="Learn Preact"
					description="If you're new to Preact, try the interactive tutorial to learn important concepts"
					href="https://preactjs.com/tutorial"
				/>
				<Resource
					title="Differences to React"
					description="If you're coming from React, you may want to check out our docs to see where Preact differs"
					href="https://preactjs.com/guide/v10/differences-to-react"
				/>
			</section>
		</div>
	);
}

function Resource(props: { href: string; title: string; description: string }) {
	return (
		<a href={props.href} rel="noreferrer" target="_blank" class="resource">
			<h2>{props.title}</h2>
			<p>{props.description}</p>
		</a>
	);
}
