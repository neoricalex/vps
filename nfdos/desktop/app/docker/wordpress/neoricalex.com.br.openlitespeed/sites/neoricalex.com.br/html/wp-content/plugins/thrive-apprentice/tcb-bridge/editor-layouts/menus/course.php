<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden!
}
?>
<div id="tve-course-component" class="tve-component" data-view="Course">
	<div class="dropdown-header" data-prop="docked">
		<?php echo __( 'Course Options', TVA_Const::T ); ?>
		<i></i>
	</div>
	<div class="dropdown-content">
		<div class="tcb-text-center">
			<button class="tve-button orange mb-10 click" data-fn="editCourse">
				<?php echo __( 'Edit Design', TVA_Const::T ); ?>
			</button>
		</div>
		<hr>
		<div class="tve-control hide-states" data-view="Palettes"></div>
		<div class="control-grid">
			<div class="label">
				<?php echo __( 'Change course', TVA_Const::T ); ?>
			</div>
		</div>
		<div class="tve-control mb-10" data-view="changeCourse"></div>
		<div class="control-grid">
			<div class="label">
				<?php echo __( 'Course display level', TVA_Const::T ); ?>
			</div>
		</div>
		<div class="tve-control mb-10" data-view="displayLevel"></div>
		<div class="control-grid">
			<div class="label">
				<?php echo __( 'Allow the following to be collapsed', TVA_Const::T ); ?>
			</div>
		</div>
		<div class="tve-control mb-10" data-view="AllowCollapsed"></div>
		<div class="default-state-toggle">
			<div class="control-grid">
				<div class="label">
					<?php echo __( 'Default state', TVA_Const::T ); ?>
				</div>
			</div>
			<div class="tve-control" data-view="DefaultState"></div>
		</div>
		<div id="tva-course-message" class="mt-10"></div>
	</div>
</div>
