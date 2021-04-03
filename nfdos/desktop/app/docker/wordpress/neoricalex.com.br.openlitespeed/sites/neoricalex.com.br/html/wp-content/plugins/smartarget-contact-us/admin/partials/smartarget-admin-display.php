<?php

/**
 * Provide a admin area view for the plugin
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       https://smartarget.online
 * @since      1.0.0
 *
 * @package    Smartarget
 * @subpackage Smartarget/admin/partials
 */
?>

<style>
	.support-block a
	{
		opacity: 1;
		text-decoration: none;
		box-shadow: none !important;
	}

	.support-block a:hover
	{
		opacity: 0.8;
	}

	.support-block svg
	{
		width: 35px;
		height: 35px;
		margin-right: 10px;
	}

	p.submit
	{
		margin-top: 5px;
	}

</style>

<form method="post" name="my_options" action="options.php">

	<?php

	// Загрузить все значения элементов формы
	$options = get_option($this->plugin_name);

	// текущие состояние опций
	$smartarget_user_id = $options['smartarget_user_id'];

	// Выводит скрытые поля формы на странице настроек
	settings_fields( $this->plugin_name );
	do_settings_sections( $this->plugin_name );

	?>

	<h2><?php echo esc_html( get_admin_page_title() ); ?></h2>

	<h4>Follow this steps to add Smartarget - Contact Us</h4>

	<ol style="margin-bottom: 50px">
		<li>Create a <a href="https://smartarget.online/page_signup.html?ref=wp" target=_blank>Smartarget</a> account or log in to yours</li>
		<li><a href="https://app.smartarget.online/#/websites" target=_blank>Add your website</a> and configure Whatsapp - Contact Us app for your website</li>
		<li>Go to <a href="https://app.smartarget.online/#/integration" target=_blank>Integration</a> and copy the User ID to the input text box to this page</li>
	</ol>

	<fieldset>
		<legend class="screen-reader-text"><span><?php _e('Smartarget User Id', $this->plugin_name);?></span></legend>
		<label for="<?php echo $this->plugin_name;?>-smartarget_user_id" style="margin-bottom: 5px; display: inline-block">
			<span><?php esc_attr_e('Smartarget User Id', $this->plugin_name);?></span>
		</label>
		<br>
		<input type="text"
		       class="regular-text" id="<?php echo $this->plugin_name;?>-smartarget_user_id"
		       name="<?php echo $this->plugin_name;?>[smartarget_user_id]"
		       value="<?php if(!empty($smartarget_user_id)) esc_attr_e($smartarget_user_id, $this->plugin_name);?>"
		       placeholder="<?php esc_attr_e('Smartarget User Id', $this->plugin_name);?>"
		/>
	</fieldset>

	<?php submit_button(__('Save all changes', $this->plugin_name), 'primary','submit', TRUE); ?>

	<h4>Need Support?</h4>
	<div class="support-block">
		<a href="https://web.whatsapp.com/send?phone=4915737970117" target=_blank>
			<svg enable-background="new 0 0 128 128" id="Social_Icons" version="1.1" viewBox="0 0 128 128" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="_x36__stroke"><g id="WhatsApp"><rect clip-rule="evenodd" fill="none" fill-rule="evenodd" height="128" width="128"/><path clip-rule="evenodd" d="M46.114,32.509    c-1.241-2.972-2.182-3.085-4.062-3.161c-0.64-0.037-1.353-0.074-2.144-0.074c-2.446,0-5.003,0.715-6.546,2.295    c-1.88,1.919-6.545,6.396-6.545,15.576c0,9.181,6.695,18.06,7.598,19.303c0.941,1.24,13.053,20.354,31.86,28.144    c14.707,6.095,19.071,5.53,22.418,4.816c4.89-1.053,11.021-4.667,12.564-9.03c1.542-4.365,1.542-8.09,1.09-8.88    c-0.451-0.79-1.693-1.24-3.573-2.182c-1.88-0.941-11.021-5.456-12.751-6.058c-1.693-0.639-3.31-0.413-4.588,1.393    c-1.806,2.521-3.573,5.08-5.003,6.622c-1.128,1.204-2.972,1.355-4.514,0.715c-2.069-0.864-7.861-2.898-15.008-9.256    c-5.53-4.928-9.291-11.06-10.381-12.904c-1.091-1.881-0.113-2.973,0.752-3.988c0.941-1.167,1.843-1.994,2.783-3.086    c0.941-1.091,1.467-1.655,2.069-2.935c0.64-1.241,0.188-2.521-0.263-3.462C51.418,45.414,47.657,36.233,46.114,32.509z M63.981,0    C28.699,0,0,28.707,0,63.999c0,13.996,4.514,26.977,12.187,37.512L4.212,125.29l24.6-7.862C38.93,124.125,51.004,128,64.019,128    C99.301,128,128,99.291,128,64.001c0-35.292-28.699-63.999-63.981-63.999h-0.037V0z" fill="#67C15E" fill-rule="evenodd" id="WhatsApp_1_"/></g></g></svg>
		</a>
		<a href="https://t.me/erezson" target=_blank>
			<svg enable-background="new 0 0 100 100" height="100px" id="Layer_1" version="1.1" viewBox="0 0 100 100" width="100px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><circle cx="50" cy="50" fill="#139BD0" r="45"/><path clip-rule="evenodd" d="M51.474,60.754c-1.733,1.688-3.451,3.348-5.153,5.021   c-0.595,0.586-1.264,0.91-2.118,0.865c-0.583-0.031-0.909-0.287-1.088-0.84c-1.304-4.047-2.627-8.084-3.924-12.135   c-0.126-0.393-0.312-0.584-0.71-0.707c-3.072-0.938-6.138-1.898-9.199-2.871c-0.471-0.15-0.946-0.346-1.353-0.623   c-0.629-0.426-0.721-1.121-0.157-1.621c0.521-0.461,1.143-0.863,1.789-1.119c3.755-1.488,7.53-2.928,11.299-4.381   c9.565-3.693,19.13-7.383,28.696-11.076c1.819-0.703,3.217,0.287,3.028,2.254c-0.121,1.258-0.447,2.496-0.71,3.738   c-2.077,9.807-4.156,19.615-6.244,29.42c-0.496,2.328-2.131,2.936-4.047,1.523c-3.209-2.365-6.415-4.738-9.622-7.107   C51.808,60.984,51.649,60.877,51.474,60.754z M44.271,63.732c0.036-0.01,0.072-0.02,0.108-0.029   c0.02-0.092,0.049-0.182,0.057-0.273c0.206-2.223,0.424-4.445,0.603-6.672c0.04-0.496,0.21-0.848,0.583-1.182   c2.958-2.645,5.898-5.307,8.844-7.963c3.261-2.941,6.523-5.879,9.772-8.832c0.201-0.182,0.285-0.492,0.423-0.744   c-0.306-0.033-0.634-0.156-0.912-0.084c-0.379,0.098-0.738,0.318-1.076,0.531c-7.197,4.533-14.388,9.074-21.59,13.598   c-0.407,0.256-0.483,0.473-0.328,0.92c0.531,1.525,1.014,3.064,1.515,4.6C42.937,59.646,43.604,61.689,44.271,63.732z" fill="#FFFFFF" fill-rule="evenodd"/></g></svg>
		</a>
		<a href="mailto:support@smartarget.online" target=_blank>
			<svg enable-background="new -0.709 -27.689 141.732 141.732" height="141.732px" id="Livello_1" version="1.1" viewBox="-0.709 -27.689 141.732 141.732" width="141.732px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Livello_106"><path d="M90.854,43.183l39.834,34.146l-3.627,3.627L86.924,46.552L70.177,60.907L53.626,46.719L13.693,80.951l-3.807-3.807   L49.5,43.182L9.68,9.044l3.627-3.627l56.676,48.587L82.8,43.016l-0.035-0.032h0.073l43.829-37.575l3.811,3.811L90.854,43.183z    M140.314,80.96V5.411c0-2.988-2.416-5.411-5.396-5.411c-0.021,0-0.041,0.003-0.062,0.004C134.835,0.003,134.814,0,134.793,0   c-0.333,0-0.655,0.035-0.975,0.098V0.018H11.158V0.01H5.564C5.508,0.007,5.453,0,5.396,0C5.376,0,5.355,0.003,5.334,0.004   C5.312,0.003,5.293,0,5.271,0C2.359,0,0,2.366,0,5.284c0,0.021,0.003,0.042,0.003,0.063C0.003,5.368,0,5.39,0,5.411V80.96   c0,2.979,2.416,5.396,5.396,5.396h129.521C137.898,86.355,140.314,83.939,140.314,80.96"/></g><g id="Livello_1_1_"/></svg>
		</a>
	</div>
</form>

