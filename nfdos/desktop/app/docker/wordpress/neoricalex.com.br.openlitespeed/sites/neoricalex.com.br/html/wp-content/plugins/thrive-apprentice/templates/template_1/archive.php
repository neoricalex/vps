<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}

tva_overwrite_post();
?>

<?php include_once( TVA_Const::plugin_path( 'templates/header.php' ) ); ?>

<?php
$course = tva_get_course_by_slug(
	$term,
	array(
		'published'  => true,
		'protection' => true,
	)
);

$settings    = tva_get_settings_manager()->localize_values();
$so_settings = TVA_Sendowl_Settings::instance()->get_settings();
?>

<?php $topic = tva_get_topic_by_id( $course->topic ); ?>
<div class="tva-cm-redesigned-breadcrumbs">
	<?php tva_custom_breadcrumbs(); ?>
</div>
<div class="tva-frontend-template" id="tva-course-overview">
	<div class="tva-container">
		<div class="tva-course-head tva-course-head-<?php echo $topic['ID']; ?> tva-course-type-<?php echo $course->course_type_class; ?>">
			<div class="tva-course-icon">
				<?php if ( isset( $topic['icon_type'] ) && ( 'svg_icon' === $topic['icon_type'] ) && isset( $topic['svg_icon'] ) ) : ?>
					<div class="tva-svg-front" id="tva-topic-<?php echo $topic['ID']; ?>">
						<?php echo $topic['svg_icon']; ?>
					</div>
				<?php else : ?>
					<?php $img_url = $topic['icon'] ? $topic['icon'] : TVA_Const::get_default_course_icon_url(); ?>
					<div class="tva-topic-icon" style="background-image:url('<?php echo $img_url; ?>')"></div>
				<?php endif; ?>

				<span class="tva-lesson-name"><?php echo $topic['title']; ?></span>
			</div>
			<div class="tva-uni-course-type">
				<i></i>
				<span><?php echo tva_is_course_guide( $course ) ? __( 'Guide', 'thrive-apprentice' ) : $course->course_type; ?></span>
			</div>
		</div>
		<div class="tva-featured-image-container-single" <?php echo ! $course->cover_image ? 'style="background-color: ' . $topic['color'] . '; opacity: 0.7"' : ''; ?>>
			<div class="tva-image-overlay"></div>
			<?php if ( ! empty( $course->cover_image ) ) : ?>
				<div style="background-image:url('<?php echo $course->cover_image; ?>')" class="tva-image-as-bg"></div>
			<?php endif; ?>
		</div>

		<section
				class="tva-course-section <?php echo ( ( tva_is_course_guide( $course ) ) ) && ! is_active_sidebar( 'tva-sidebar' ) ? 'tva-course-guide-section' : ''; ?>">

			<div class="tva-archive-content">
				<?php show_welcome_msg( $course ); ?>

				<h1 class="tva_course_title"><?php echo $course->name; ?></h1>
				<div class="tva_page_headline_wrapper tva-course-counters">
					<div class="tva-course-numbers">
						<?php if ( $course->modules_count > 0 ) : ?>
							<span class="item-value"><?php echo $course->modules_count; ?> </span>
							<span class="item-name <?php echo 1 === $course->modules_count ? 'tva_course_module' : 'tva_course_modules'; ?>">
									<?php echo 1 === $course->modules_count ? $settings['template']['course_module'] : $settings['template']['course_modules']; ?>
								</span>
						<?php endif; ?>
						<?php if ( $course->chapters_count > 0 ) : ?>
							<span class="item-value">
									<?php echo $course->chapters_count; ?>
								</span>
							<span class="item-name <?php echo 1 === $course->chapters_count ? 'tva_course_chapter' : 'tva_course_chapters'; ?> ">
								<?php echo 1 === $course->chapters_count ? $settings['template']['course_chapter'] : $settings['template']['course_chapters']; ?>
							</span>
						<?php endif; ?>
						<?php if ( $course->published_lessons_count > 0 ) : ?>
							<span class="item-value">
								<?php echo $course->published_lessons_count; ?>
							</span>
							<span class="item-name <?php echo 1 === $course->published_lessons_count ? 'tva_course_lesson' : 'tva_course_lessons'; ?>">
								<?php echo 1 === $course->published_lessons_count ? $settings['template']['course_lesson'] : $settings['template']['course_lessons']; ?>
							</span>
						<?php endif; ?>

						<span class="tva-course-dificulty">
								<?php if ( 0 != $course->level ) : ?>
									<?php foreach ( $levels as $level ) : ?>
										<?php if ( $level['ID'] == $course->level ) : ?>
											<?php echo $level['name']; ?>
										<?php endif; ?>
									<?php endforeach; ?>
								<?php endif; ?>
							</span>
					</div>

					<p class="tva_page_headline tva_page_headline_text">
						<?php echo isset( $settings['template']['page_headline_text'] ) ? $settings['template']['page_headline_text'] : TVA_Const::TVA_ABOUT; ?>
					</p>

					<?php if ( tva_course()->has_video() ) : ?>
						<div class="tva-featured-video-container-single">
							<?php echo tva_course()->get_video()->get_embed_code(); ?>
						</div>
					<?php endif ?>
				</div>

				<div class="tva-course-description">
					<div class="tva_paragraph">
						<?php echo $course->description; ?>
					</div>
				</div>

				<?php if ( tva_access_manager()->has_access() ) : ?>
					<a class="tva_start_course tva_main_color_bg" href="<?php echo tva_get_start_course_url( $course ); ?>">
						<?php /*if design preview, always show the "Start course" btn label*/ echo tva_is_inner_frame() ? TVA_Dynamic_Labels::get_cta_label( 'not_started' ) : TVA_Dynamic_Labels::get_course_cta( $course ); ?>
					</a>
				<?php endif; ?>
			</div>
			<div class="tva-cm-container">
				<h1 class="tva_course_structure"><?php echo $settings['template']['course_structure']; ?></h1>

				<?php if ( ! empty( $course->modules ) ) : ?>
					<?php foreach ( $course->modules as $module ) : ?>
						<?php echo tva_generate_module_html( $module ); ?>
					<?php endforeach; ?>
				<?php elseif ( ! empty( $course->chapters ) ) : ?>
					<?php foreach ( $course->chapters as $chapter ) : ?>
						<?php echo tva_generate_chapter_html( $chapter, true ); ?>
					<?php endforeach; ?>
				<?php else : ?>
					<?php if ( ! empty( $course->lessons ) ) : ?>
						<?php foreach ( $course->lessons as $lesson ) : ?>
							<?php echo tva_generate_lesson_html( $lesson, true ); ?>
						<?php endforeach; ?>
					<?php endif; ?>
				<?php endif ?>
			</div>

			<?php
			if ( ( 'open' === $course->comment_status ) && ( true === tva_access_manager()->can_comment() ) ) {
				TVA_Db::setCommentsStatus();
				comments_template( '', true );
				echo apply_filters( 'comment_form_submit_field', '', array() );
				tva_add_tcm_triggers();
			}
			?>
		</section>
		<?php if ( is_active_sidebar( 'tva-sidebar' ) ) : ?>
			<aside class="tva-sidebar-container">
				<div class="tva-sidebar-wrapper">
					<?php dynamic_sidebar( 'tva-sidebar' ); ?>
				</div>
			</aside>
		<?php endif; ?>
	</div>
</div>

<?php echo tva_add_apprentice_label(); ?>

<?php include_once( TVA_Const::plugin_path( 'templates/footer.php' ) ); ?>
