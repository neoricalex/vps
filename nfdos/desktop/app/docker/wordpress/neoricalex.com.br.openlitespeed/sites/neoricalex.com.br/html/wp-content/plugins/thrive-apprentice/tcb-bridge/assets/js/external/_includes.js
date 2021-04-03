module.exports = {
	Views: {
		Components: {
			Course: require( './components/course' ),
			CourseStructureItem: require( './components/course-structure-item' ),
		},
	},
	renderers: require( './elements/_renderers' ),
};
