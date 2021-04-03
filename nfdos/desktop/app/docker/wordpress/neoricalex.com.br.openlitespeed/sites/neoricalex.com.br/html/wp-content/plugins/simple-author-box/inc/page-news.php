<style>
.sab-changes-box {
  border: 1px solid #ccc;
  background: #fafafa;
  padding:10px;
  max-height:100px;
  overflow: auto;
  max-width: 600px;
}
</style>
<div class="sab-content-page">

  <h1>News</h1>
  <h2>Simple Author Box latest changes:</h2>

  <div class="sab-changes-box">
    <pre>= 2.3.16 =
* Fixed missing files

= 2.3.14 =
* Fixed PHP notice "roles"

= 2.3.15 =
* Fixed missing link on avatar

= 2.3.13 =
* Fixed visibility issue

= 2.3.12 =
* Fixed: wrong class name issue

= 2.3.11 =
* New feature: function wpsabox_author_box now accepts param $user_id

= 2.3.10 =
* Fixed: custom author's page (Premium only)

= 2.3.9 =
* New feature: custom author's page (Premium only)

= 2.3.8 =
* Fixed visibility on archives (Premium only)

= 2.3.7 =
* Removed protocol prefix from the website URL
* Added controls for brackets in the job title (Premium only)</pre>
  </div>

  <h2 style="margin-top:40px;">Other plugins from GreenTreeLabs:</h2>

  <style>
  .sab-plugin {
    width: 300px;
    display: inline-block;
    background: #fff;
    border: 1px solid #ccc;
    padding: 4px 4px 20px 4px;
    margin:0 10px 10px 0;
  }
  .sab-plugin img {
    width: 100%;
  }
  .sab-plugin p {
    padding: 10px;
  }
  .sab-center {
    text-align: center;
  }
  .sab-plugin .sab-button {
    display:inline-block;

  }
  </style>

  <div class="sab-plugins">
    <?php foreach($plugins as $plugin) : ?>
      <div class="sab-plugin">
        <a target="_blank" href="<?php echo $plugin["url"] ?>">
          <img src="<?php echo SIMPLE_AUTHOR_BOX_ASSETS . "img/" , $plugin["image"] ?>" alt="Go to <?php echo $plugin["name"] ?>" />
        </a>
        <p><?php echo $plugin["description"] ?></p>
        <div class="sab-center">
          <a target="_blank" class="button button-primary button-hero" href="<?php echo $plugin["url"] ?>"><?php _e('Read more') ?></a>
        </div>
      </div>
    <?php endforeach ?>
  </div>
</div>