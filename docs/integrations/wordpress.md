# WordPress Integration Guide

This guide covers how to integrate the CustomGPT widget into WordPress websites using various methods.

## Table of Contents
- [Quick Start](#quick-start)
- [Integration Methods](#integration-methods)
  - [Method 1: Plugin (Recommended)](#method-1-plugin-recommended)
  - [Method 2: Theme Functions](#method-2-theme-functions)
  - [Method 3: Shortcode](#method-3-shortcode)
  - [Method 4: Gutenberg Block](#method-4-gutenberg-block)
  - [Method 5: Elementor Widget](#method-5-elementor-widget)
- [Security Configuration](#security-configuration)
- [Advanced Features](#advanced-features)
- [WooCommerce Integration](#woocommerce-integration)
- [Multisite Support](#multisite-support)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Quick Start

The fastest way to add CustomGPT to your WordPress site:

### 1. Add to Header (Site-wide)

Add this to your theme's `header.php` before `</head>`:

```html
<!-- CustomGPT Widget -->
<script src="https://your-domain.com/widget/customgpt-widget.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  CustomGPTWidget.init({
    agentId: 123,
    mode: 'floating',
    position: 'bottom-right'
  });
});
</script>
```

### 2. Using WordPress Customizer

Add via **Appearance > Customize > Additional CSS/JS**:

```javascript
// Add to Custom JavaScript section
jQuery(document).ready(function($) {
  if (typeof CustomGPTWidget !== 'undefined') {
    CustomGPTWidget.init({
      agentId: 123,
      mode: 'floating'
    });
  }
});
```

## Integration Methods

### Method 1: Plugin (Recommended)

Create a custom plugin for the most maintainable approach:

#### Create Plugin File

Create `/wp-content/plugins/customgpt-integration/customgpt-integration.php`:

```php
<?php
/**
 * Plugin Name: CustomGPT Integration
 * Description: Integrates CustomGPT chat widget into WordPress
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CustomGPT_Integration {
    
    private $options;
    
    public function __construct() {
        $this->options = get_option('customgpt_settings');
        
        // Hook into WordPress
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
    }
    
    public function enqueue_scripts() {
        // Only load if enabled
        if (empty($this->options['enabled'])) {
            return;
        }
        
        // Register the widget script
        wp_register_script(
            'customgpt-widget',
            $this->options['widget_url'] ?? 'https://your-domain.com/widget/customgpt-widget.js',
            array(),
            '1.0.0',
            true
        );
        
        // Enqueue the script
        wp_enqueue_script('customgpt-widget');
    }
    
    public function render_widget() {
        // Only render if enabled
        if (empty($this->options['enabled']) || empty($this->options['agent_id'])) {
            return;
        }
        
        // Prepare configuration
        $config = array(
            'agentId' => intval($this->options['agent_id']),
            'mode' => $this->options['mode'] ?? 'floating',
            'theme' => $this->options['theme'] ?? 'light',
            'position' => $this->options['position'] ?? 'bottom-right'
        );
        
        // Add conditional logic
        $show_widget = true;
        
        // Check page restrictions
        if (!empty($this->options['show_on_pages'])) {
            $allowed_pages = explode(',', $this->options['show_on_pages']);
            $current_page_id = get_the_ID();
            $show_widget = in_array($current_page_id, $allowed_pages);
        }
        
        // Check user role restrictions
        if (!empty($this->options['user_roles']) && is_user_logged_in()) {
            $user = wp_get_current_user();
            $allowed_roles = $this->options['user_roles'];
            $show_widget = !empty(array_intersect($allowed_roles, $user->roles));
        }
        
        if (!$show_widget) {
            return;
        }
        
        ?>
        <script>
        (function() {
            function initCustomGPT() {
                if (typeof CustomGPTWidget !== 'undefined') {
                    CustomGPTWidget.init(<?php echo json_encode($config); ?>);
                }
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initCustomGPT);
            } else {
                initCustomGPT();
            }
        })();
        </script>
        <?php
    }
    
    public function add_admin_menu() {
        add_options_page(
            'CustomGPT Settings',
            'CustomGPT',
            'manage_options',
            'customgpt',
            array($this, 'options_page')
        );
    }
    
    public function settings_init() {
        register_setting('customgpt_settings', 'customgpt_settings');
        
        add_settings_section(
            'customgpt_section',
            'CustomGPT Widget Settings',
            null,
            'customgpt_settings'
        );
        
        // Add settings fields
        $this->add_settings_field('enabled', 'Enable Widget', 'checkbox');
        $this->add_settings_field('agent_id', 'Agent ID', 'number');
        $this->add_settings_field('widget_url', 'Widget URL', 'text');
        $this->add_settings_field('mode', 'Display Mode', 'select', array(
            'options' => array(
                'floating' => 'Floating Button',
                'embedded' => 'Embedded',
                'fullscreen' => 'Fullscreen'
            )
        ));
        $this->add_settings_field('theme', 'Theme', 'select', array(
            'options' => array(
                'light' => 'Light',
                'dark' => 'Dark'
            )
        ));
        $this->add_settings_field('position', 'Position', 'select', array(
            'options' => array(
                'bottom-right' => 'Bottom Right',
                'bottom-left' => 'Bottom Left',
                'top-right' => 'Top Right',
                'top-left' => 'Top Left'
            )
        ));
    }
    
    private function add_settings_field($id, $title, $type, $args = array()) {
        add_settings_field(
            'customgpt_' . $id,
            $title,
            array($this, 'render_field'),
            'customgpt_settings',
            'customgpt_section',
            array_merge(array('id' => $id, 'type' => $type), $args)
        );
    }
    
    public function render_field($args) {
        $id = $args['id'];
        $type = $args['type'];
        $value = $this->options[$id] ?? '';
        
        switch ($type) {
            case 'checkbox':
                echo '<input type="checkbox" name="customgpt_settings[' . $id . ']" value="1" ' . 
                     checked(1, $value, false) . ' />';
                break;
                
            case 'number':
                echo '<input type="number" name="customgpt_settings[' . $id . ']" value="' . 
                     esc_attr($value) . '" />';
                break;
                
            case 'text':
                echo '<input type="text" name="customgpt_settings[' . $id . ']" value="' . 
                     esc_attr($value) . '" class="regular-text" />';
                break;
                
            case 'select':
                echo '<select name="customgpt_settings[' . $id . ']">';
                foreach ($args['options'] as $key => $label) {
                    echo '<option value="' . $key . '" ' . selected($value, $key, false) . '>' . 
                         $label . '</option>';
                }
                echo '</select>';
                break;
        }
    }
    
    public function options_page() {
        ?>
        <div class="wrap">
            <h1>CustomGPT Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('customgpt_settings');
                do_settings_sections('customgpt_settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}

// Initialize the plugin
new CustomGPT_Integration();
```

#### Activate Plugin

1. Go to **Plugins > Installed Plugins**
2. Find "CustomGPT Integration"
3. Click **Activate**
4. Configure in **Settings > CustomGPT**

### Method 2: Theme Functions

Add to your theme's `functions.php`:

```php
// Add CustomGPT widget to WordPress
function add_customgpt_widget() {
    // Only load on front-end
    if (is_admin()) {
        return;
    }
    
    // Register script
    wp_register_script(
        'customgpt-widget',
        'https://your-domain.com/widget/customgpt-widget.js',
        array(),
        '1.0.0',
        true
    );
    
    // Configuration
    $config = array(
        'agentId' => 123,
        'mode' => 'floating',
        'theme' => get_theme_mod('customgpt_theme', 'light'),
        'position' => 'bottom-right'
    );
    
    // Localize script with configuration
    wp_localize_script('customgpt-widget', 'customGPTConfig', $config);
    
    // Enqueue script
    wp_enqueue_script('customgpt-widget');
    
    // Add initialization script
    wp_add_inline_script('customgpt-widget', '
        document.addEventListener("DOMContentLoaded", function() {
            if (typeof CustomGPTWidget !== "undefined" && typeof customGPTConfig !== "undefined") {
                CustomGPTWidget.init(customGPTConfig);
            }
        });
    ');
}
add_action('wp_enqueue_scripts', 'add_customgpt_widget');

// Add theme customizer options
function customgpt_customize_register($wp_customize) {
    // Add section
    $wp_customize->add_section('customgpt_settings', array(
        'title' => 'CustomGPT Chat',
        'priority' => 120,
    ));
    
    // Add settings
    $wp_customize->add_setting('customgpt_theme', array(
        'default' => 'light',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    // Add controls
    $wp_customize->add_control('customgpt_theme', array(
        'label' => 'Widget Theme',
        'section' => 'customgpt_settings',
        'type' => 'select',
        'choices' => array(
            'light' => 'Light',
            'dark' => 'Dark',
        ),
    ));
}
add_action('customize_register', 'customgpt_customize_register');
```

### Method 3: Shortcode

Create a shortcode for embedding in posts/pages:

```php
// Register CustomGPT shortcode
function customgpt_shortcode($atts) {
    // Parse attributes
    $atts = shortcode_atts(array(
        'agent_id' => 123,
        'mode' => 'embedded',
        'theme' => 'light',
        'height' => '600px',
        'width' => '100%',
        'class' => 'customgpt-container'
    ), $atts, 'customgpt');
    
    // Generate unique ID
    $container_id = 'customgpt-' . uniqid();
    
    // Enqueue script if not already done
    if (!wp_script_is('customgpt-widget', 'enqueued')) {
        wp_enqueue_script(
            'customgpt-widget',
            'https://your-domain.com/widget/customgpt-widget.js',
            array(),
            '1.0.0',
            true
        );
    }
    
    // Build output
    $output = sprintf(
        '<div id="%s" class="%s" style="height: %s; width: %s;"></div>',
        esc_attr($container_id),
        esc_attr($atts['class']),
        esc_attr($atts['height']),
        esc_attr($atts['width'])
    );
    
    // Add initialization script
    $output .= '<script>
    (function() {
        function initWidget() {
            if (typeof CustomGPTWidget !== "undefined") {
                CustomGPTWidget.init({
                    agentId: ' . intval($atts['agent_id']) . ',
                    mode: "' . esc_js($atts['mode']) . '",
                    theme: "' . esc_js($atts['theme']) . '",
                    containerId: "' . esc_js($container_id) . '"
                });
            }
        }
        
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", initWidget);
        } else {
            initWidget();
        }
    })();
    </script>';
    
    return $output;
}
add_shortcode('customgpt', 'customgpt_shortcode');
```

Usage in posts/pages:
```
[customgpt agent_id="123" mode="embedded" theme="dark" height="500px"]
```

### Method 4: Gutenberg Block

Create a custom Gutenberg block:

```javascript
// blocks/customgpt/index.js
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, SelectControl, ToggleControl } = wp.components;
const { useEffect, useState } = wp.element;

registerBlockType('customgpt/chat-widget', {
    title: 'CustomGPT Chat',
    icon: 'format-chat',
    category: 'widgets',
    attributes: {
        agentId: {
            type: 'string',
            default: '123'
        },
        mode: {
            type: 'string',
            default: 'embedded'
        },
        theme: {
            type: 'string',
            default: 'light'
        },
        height: {
            type: 'string',
            default: '600px'
        },
        enableCitations: {
            type: 'boolean',
            default: true
        }
    },
    
    edit: ({ attributes, setAttributes }) => {
        const { agentId, mode, theme, height, enableCitations } = attributes;
        const [widgetLoaded, setWidgetLoaded] = useState(false);
        
        useEffect(() => {
            // Load widget script in editor
            if (!window.CustomGPTWidget && !widgetLoaded) {
                const script = document.createElement('script');
                script.src = 'https://your-domain.com/widget/customgpt-widget.js';
                script.onload = () => setWidgetLoaded(true);
                document.body.appendChild(script);
            }
        }, []);
        
        return (
            <>
                <InspectorControls>
                    <PanelBody title="Widget Settings">
                        <TextControl
                            label="Agent ID"
                            value={agentId}
                            onChange={(value) => setAttributes({ agentId: value })}
                        />
                        <SelectControl
                            label="Display Mode"
                            value={mode}
                            options={[
                                { label: 'Embedded', value: 'embedded' },
                                { label: 'Floating', value: 'floating' },
                                { label: 'Fullscreen', value: 'fullscreen' }
                            ]}
                            onChange={(value) => setAttributes({ mode: value })}
                        />
                        <SelectControl
                            label="Theme"
                            value={theme}
                            options={[
                                { label: 'Light', value: 'light' },
                                { label: 'Dark', value: 'dark' }
                            ]}
                            onChange={(value) => setAttributes({ theme: value })}
                        />
                        {mode === 'embedded' && (
                            <TextControl
                                label="Height"
                                value={height}
                                onChange={(value) => setAttributes({ height: value })}
                            />
                        )}
                        <ToggleControl
                            label="Enable Citations"
                            checked={enableCitations}
                            onChange={(value) => setAttributes({ enableCitations: value })}
                        />
                    </PanelBody>
                </InspectorControls>
                
                <div className="customgpt-block-wrapper">
                    {mode === 'embedded' ? (
                        <div style={{ height, border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>
                            <p>CustomGPT Chat Widget</p>
                            <p><small>Agent ID: {agentId}</small></p>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', background: '#f0f0f0', textAlign: 'center' }}>
                            <p>CustomGPT {mode} widget will appear on the frontend</p>
                        </div>
                    )}
                </div>
            </>
        );
    },
    
    save: ({ attributes }) => {
        const { agentId, mode, theme, height, enableCitations } = attributes;
        const containerId = `customgpt-${Math.random().toString(36).substr(2, 9)}`;
        
        return (
            <div className="wp-block-customgpt-chat-widget">
                {mode === 'embedded' && (
                    <div id={containerId} style={{ height }}></div>
                )}
                <script dangerouslySetInnerHTML={{
                    __html: `
                    (function() {
                        function initCustomGPT() {
                            if (typeof CustomGPTWidget !== 'undefined') {
                                CustomGPTWidget.init({
                                    agentId: ${agentId},
                                    mode: '${mode}',
                                    theme: '${theme}',
                                    ${mode === 'embedded' ? `containerId: '${containerId}',` : ''}
                                    enableCitations: ${enableCitations}
                                });
                            }
                        }
                        
                        if (document.readyState === 'loading') {
                            document.addEventListener('DOMContentLoaded', initCustomGPT);
                        } else {
                            initCustomGPT();
                        }
                    })();
                    `
                }} />
            </div>
        );
    }
});
```

Register the block in PHP:

```php
function register_customgpt_block() {
    wp_register_script(
        'customgpt-block',
        get_template_directory_uri() . '/blocks/customgpt/index.js',
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components')
    );
    
    register_block_type('customgpt/chat-widget', array(
        'editor_script' => 'customgpt-block',
    ));
}
add_action('init', 'register_customgpt_block');
```

### Method 5: Elementor Widget

Create an Elementor widget:

```php
// elementor-widgets/customgpt-widget.php
class Elementor_CustomGPT_Widget extends \Elementor\Widget_Base {
    
    public function get_name() {
        return 'customgpt_chat';
    }
    
    public function get_title() {
        return 'CustomGPT Chat';
    }
    
    public function get_icon() {
        return 'eicon-chat';
    }
    
    public function get_categories() {
        return ['general'];
    }
    
    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => 'Widget Settings',
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );
        
        $this->add_control(
            'agent_id',
            [
                'label' => 'Agent ID',
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 123,
                'min' => 1,
            ]
        );
        
        $this->add_control(
            'display_mode',
            [
                'label' => 'Display Mode',
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'embedded',
                'options' => [
                    'embedded' => 'Embedded',
                    'floating' => 'Floating',
                ],
            ]
        );
        
        $this->add_control(
            'theme',
            [
                'label' => 'Theme',
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'light',
                'options' => [
                    'light' => 'Light',
                    'dark' => 'Dark',
                ],
            ]
        );
        
        $this->add_control(
            'height',
            [
                'label' => 'Height',
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', 'vh'],
                'range' => [
                    'px' => [
                        'min' => 300,
                        'max' => 1000,
                        'step' => 10,
                    ],
                    'vh' => [
                        'min' => 30,
                        'max' => 100,
                    ],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 600,
                ],
                'condition' => [
                    'display_mode' => 'embedded',
                ],
            ]
        );
        
        $this->end_controls_section();
    }
    
    protected function render() {
        $settings = $this->get_settings_for_display();
        $container_id = 'customgpt-' . $this->get_id();
        
        if ($settings['display_mode'] === 'embedded') {
            echo '<div id="' . $container_id . '" style="height: ' . 
                 $settings['height']['size'] . $settings['height']['unit'] . ';"></div>';
        }
        
        ?>
        <script>
        (function() {
            function initWidget() {
                if (typeof CustomGPTWidget !== 'undefined') {
                    CustomGPTWidget.init({
                        agentId: <?php echo intval($settings['agent_id']); ?>,
                        mode: '<?php echo esc_js($settings['display_mode']); ?>',
                        theme: '<?php echo esc_js($settings['theme']); ?>',
                        <?php if ($settings['display_mode'] === 'embedded'): ?>
                        containerId: '<?php echo esc_js($container_id); ?>'
                        <?php endif; ?>
                    });
                }
            }
            
            // Wait for widget script to load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initWidget);
            } else {
                setTimeout(initWidget, 100);
            }
        })();
        </script>
        <?php
    }
    
    public function get_script_depends() {
        return ['customgpt-widget'];
    }
}

// Register widget
add_action('elementor/widgets/widgets_registered', function($widgets_manager) {
    require_once(__DIR__ . '/elementor-widgets/customgpt-widget.php');
    $widgets_manager->register(new \Elementor_CustomGPT_Widget());
});

// Register script
add_action('wp_enqueue_scripts', function() {
    wp_register_script(
        'customgpt-widget',
        'https://your-domain.com/widget/customgpt-widget.js',
        [],
        '1.0.0',
        true
    );
});
```

## Security Configuration

### 1. Nonce Verification

Add nonce verification for AJAX requests:

```php
// Add nonce to widget configuration
function customgpt_add_nonce() {
    wp_localize_script('customgpt-widget', 'customgpt_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('customgpt_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'customgpt_add_nonce');

// Verify nonce in AJAX handler
function customgpt_ajax_handler() {
    check_ajax_referer('customgpt_nonce', 'nonce');
    
    // Your AJAX logic here
    wp_send_json_success(array('message' => 'Success'));
}
add_action('wp_ajax_customgpt_action', 'customgpt_ajax_handler');
add_action('wp_ajax_nopriv_customgpt_action', 'customgpt_ajax_handler');
```

### 2. User Capability Checks

```php
// Restrict widget to logged-in users only
function customgpt_check_user_access() {
    if (!is_user_logged_in()) {
        return false;
    }
    
    // Check specific capabilities
    if (!current_user_can('read')) {
        return false;
    }
    
    return true;
}

// Use in widget rendering
if (customgpt_check_user_access()) {
    // Render widget
}
```

### 3. Content Security Policy

Add CSP headers for widget security:

```php
function customgpt_add_csp_header() {
    $csp = "default-src 'self'; ";
    $csp .= "script-src 'self' 'unsafe-inline' https://your-domain.com; ";
    $csp .= "style-src 'self' 'unsafe-inline'; ";
    $csp .= "frame-src https://your-domain.com; ";
    
    header("Content-Security-Policy: " . $csp);
}
add_action('send_headers', 'customgpt_add_csp_header');
```

## Advanced Features

### Dynamic Agent Selection

Allow users to select different agents based on context:

```php
function customgpt_get_agent_for_page() {
    // Define agent mapping
    $agent_map = array(
        'support' => 123,      // Support agent
        'sales' => 456,        // Sales agent
        'technical' => 789,    // Technical agent
    );
    
    // Check page type
    if (is_page('support')) {
        return $agent_map['support'];
    } elseif (is_page('contact-sales')) {
        return $agent_map['sales'];
    } elseif (is_singular('documentation')) {
        return $agent_map['technical'];
    }
    
    // Check post categories
    if (has_category('technical-support')) {
        return $agent_map['technical'];
    }
    
    // Default agent
    return $agent_map['support'];
}
```

### User Metadata Integration

Pass WordPress user data to the widget:

```php
function customgpt_get_user_metadata() {
    if (!is_user_logged_in()) {
        return array();
    }
    
    $user = wp_get_current_user();
    
    return array(
        'userId' => $user->ID,
        'userName' => $user->display_name,
        'userEmail' => $user->user_email,
        'userRole' => implode(',', $user->roles),
        'memberSince' => $user->user_registered,
    );
}

// Add to widget configuration
$config = array(
    'agentId' => 123,
    'metadata' => customgpt_get_user_metadata(),
    'sessionId' => 'wp_user_' . get_current_user_id()
);
```

### Custom Triggers

Add custom triggers for widget behavior:

```php
// Open widget on specific actions
add_action('wp_footer', function() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        // Open on contact button click
        $('.contact-support').on('click', function(e) {
            e.preventDefault();
            if (window.customGPTWidget) {
                window.customGPTWidget.open();
            }
        });
        
        // Open after time delay
        setTimeout(function() {
            if (window.customGPTWidget && !sessionStorage.getItem('widget_shown')) {
                window.customGPTWidget.open();
                sessionStorage.setItem('widget_shown', 'true');
            }
        }, 30000); // 30 seconds
        
        // Open on exit intent
        $(document).on('mouseleave', function(e) {
            if (e.clientY < 10 && !sessionStorage.getItem('exit_widget_shown')) {
                if (window.customGPTWidget) {
                    window.customGPTWidget.open();
                    sessionStorage.setItem('exit_widget_shown', 'true');
                }
            }
        });
    });
    </script>
    <?php
});
```

## WooCommerce Integration

### Add to Product Pages

```php
// Add widget to product pages
add_action('woocommerce_after_single_product_summary', function() {
    global $product;
    
    echo '<div class="customgpt-product-support">';
    echo '<h3>Have questions about this product?</h3>';
    echo '<div id="product-chat-widget"></div>';
    echo '</div>';
    
    ?>
    <script>
    (function() {
        if (typeof CustomGPTWidget !== 'undefined') {
            CustomGPTWidget.init({
                agentId: 123,
                mode: 'embedded',
                containerId: 'product-chat-widget',
                metadata: {
                    productId: <?php echo $product->get_id(); ?>,
                    productName: '<?php echo esc_js($product->get_name()); ?>',
                    productPrice: <?php echo $product->get_price(); ?>,
                    productSku: '<?php echo esc_js($product->get_sku()); ?>'
                }
            });
        }
    })();
    </script>
    <?php
}, 25);
```

### Order Support Integration

```php
// Add to order confirmation page
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);
    
    ?>
    <div class="order-support-widget">
        <h3>Need help with your order?</h3>
        <div id="order-chat"></div>
    </div>
    
    <script>
    CustomGPTWidget.init({
        agentId: 456, // Order support agent
        mode: 'embedded',
        containerId: 'order-chat',
        metadata: {
            orderId: <?php echo $order_id; ?>,
            orderTotal: <?php echo $order->get_total(); ?>,
            customerEmail: '<?php echo esc_js($order->get_billing_email()); ?>'
        }
    });
    </script>
    <?php
});
```

## Multisite Support

### Network-Wide Configuration

```php
// Network admin settings
if (is_multisite()) {
    add_action('network_admin_menu', function() {
        add_submenu_page(
            'settings.php',
            'CustomGPT Network Settings',
            'CustomGPT',
            'manage_network_options',
            'customgpt-network',
            'customgpt_network_settings_page'
        );
    });
}

function customgpt_network_settings_page() {
    // Network-wide settings
    $network_options = get_site_option('customgpt_network_settings');
    
    ?>
    <div class="wrap">
        <h1>CustomGPT Network Settings</h1>
        <form method="post" action="edit.php?action=customgpt_save_network_settings">
            <?php wp_nonce_field('customgpt_network_settings'); ?>
            
            <table class="form-table">
                <tr>
                    <th>Default Agent ID</th>
                    <td>
                        <input type="number" name="default_agent_id" 
                               value="<?php echo esc_attr($network_options['default_agent_id'] ?? ''); ?>" />
                    </td>
                </tr>
                <tr>
                    <th>Widget URL</th>
                    <td>
                        <input type="url" name="widget_url" class="regular-text"
                               value="<?php echo esc_attr($network_options['widget_url'] ?? ''); ?>" />
                    </td>
                </tr>
                <tr>
                    <th>Enable for All Sites</th>
                    <td>
                        <input type="checkbox" name="enable_all_sites" value="1"
                               <?php checked($network_options['enable_all_sites'] ?? false); ?> />
                    </td>
                </tr>
            </table>
            
            <?php submit_button('Save Network Settings'); ?>
        </form>
    </div>
    <?php
}

// Save network settings
add_action('network_admin_edit_customgpt_save_network_settings', function() {
    check_admin_referer('customgpt_network_settings');
    
    $settings = array(
        'default_agent_id' => intval($_POST['default_agent_id']),
        'widget_url' => esc_url_raw($_POST['widget_url']),
        'enable_all_sites' => isset($_POST['enable_all_sites'])
    );
    
    update_site_option('customgpt_network_settings', $settings);
    
    wp_redirect(add_query_arg(array(
        'page' => 'customgpt-network',
        'updated' => 'true'
    ), network_admin_url('settings.php')));
    exit;
});
```

### Per-Site Override

```php
// Check for site-specific settings
function customgpt_get_site_agent_id() {
    // First check site-specific setting
    $site_agent_id = get_option('customgpt_agent_id');
    
    if ($site_agent_id) {
        return $site_agent_id;
    }
    
    // Fall back to network setting
    if (is_multisite()) {
        $network_settings = get_site_option('customgpt_network_settings');
        return $network_settings['default_agent_id'] ?? null;
    }
    
    return null;
}
```

## Performance Optimization

### 1. Lazy Loading

```php
// Lazy load widget on scroll
function customgpt_lazy_load_script() {
    ?>
    <script>
    (function() {
        let widgetLoaded = false;
        
        function loadWidget() {
            if (widgetLoaded) return;
            
            const script = document.createElement('script');
            script.src = 'https://your-domain.com/widget/customgpt-widget.js';
            script.onload = function() {
                CustomGPTWidget.init({
                    agentId: <?php echo get_option('customgpt_agent_id', 123); ?>,
                    mode: 'floating'
                });
            };
            document.body.appendChild(script);
            widgetLoaded = true;
        }
        
        // Load on scroll
        let scrollHandler = function() {
            if (window.scrollY > 100) {
                loadWidget();
                window.removeEventListener('scroll', scrollHandler);
            }
        };
        
        window.addEventListener('scroll', scrollHandler);
        
        // Also load after delay
        setTimeout(loadWidget, 5000);
    })();
    </script>
    <?php
}
add_action('wp_footer', 'customgpt_lazy_load_script');
```

### 2. Resource Hints

```php
// Add resource hints for faster loading
function customgpt_resource_hints($hints, $relation_type) {
    if ('dns-prefetch' === $relation_type || 'preconnect' === $relation_type) {
        $hints[] = 'https://your-domain.com';
        $hints[] = 'https://app.customgpt.ai';
    }
    
    return $hints;
}
add_filter('wp_resource_hints', 'customgpt_resource_hints', 10, 2);
```

### 3. Conditional Loading

```php
// Load only on specific pages
function customgpt_should_load_widget() {
    // Don't load on admin pages
    if (is_admin()) {
        return false;
    }
    
    // Don't load on specific pages
    $excluded_pages = array('privacy-policy', 'terms-of-service');
    if (is_page($excluded_pages)) {
        return false;
    }
    
    // Load only on certain post types
    $allowed_post_types = array('post', 'page', 'product');
    if (!is_singular($allowed_post_types)) {
        return false;
    }
    
    // Check user settings
    $user_disabled = get_user_meta(get_current_user_id(), 'disable_chat_widget', true);
    if ($user_disabled) {
        return false;
    }
    
    return true;
}

// Use in enqueue function
if (customgpt_should_load_widget()) {
    wp_enqueue_script('customgpt-widget');
}
```

## Troubleshooting

### Common Issues

#### 1. Widget Not Appearing

```php
// Debug function
function customgpt_debug_info() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    echo '<!-- CustomGPT Debug Info -->';
    echo '<!-- Agent ID: ' . get_option('customgpt_agent_id', 'not set') . ' -->';
    echo '<!-- Widget URL: ' . get_option('customgpt_widget_url', 'default') . ' -->';
    echo '<!-- Scripts Enqueued: ' . (wp_script_is('customgpt-widget', 'enqueued') ? 'yes' : 'no') . ' -->';
    echo '<!-- User Logged In: ' . (is_user_logged_in() ? 'yes' : 'no') . ' -->';
}
add_action('wp_footer', 'customgpt_debug_info');
```

#### 2. JavaScript Conflicts

```javascript
// Conflict-free initialization
jQuery(document).ready(function($) {
    // Use jQuery no-conflict mode
    (function($) {
        // Wait for other scripts
        $(window).on('load', function() {
            setTimeout(function() {
                if (typeof CustomGPTWidget !== 'undefined') {
                    try {
                        window.customGPTWidget = CustomGPTWidget.init({
                            agentId: 123,
                            mode: 'floating'
                        });
                    } catch (error) {
                        console.error('CustomGPT initialization error:', error);
                    }
                }
            }, 1000);
        });
    })(jQuery);
});
```

#### 3. Theme Compatibility

```css
/* Add to theme CSS for compatibility */
.customgpt-widget-container {
    position: relative !important;
    z-index: 999999 !important;
}

.customgpt-widget-container * {
    box-sizing: border-box !important;
}

/* Fix for themes with aggressive CSS */
#customgpt-widget-frame {
    max-width: none !important;
    max-height: none !important;
    transform: none !important;
}
```

#### 4. Cache Issues

```php
// Clear cache when settings change
function customgpt_clear_cache() {
    // W3 Total Cache
    if (function_exists('w3tc_flush_all')) {
        w3tc_flush_all();
    }
    
    // WP Super Cache
    if (function_exists('wp_cache_clear_cache')) {
        wp_cache_clear_cache();
    }
    
    // WP Rocket
    if (function_exists('rocket_clean_domain')) {
        rocket_clean_domain();
    }
    
    // LiteSpeed Cache
    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_all();
    }
}
add_action('update_option_customgpt_settings', 'customgpt_clear_cache');
```

### Debug Mode

Enable debug mode for troubleshooting:

```php
// Add to wp-config.php
define('CUSTOMGPT_DEBUG', true);

// In your plugin/theme
if (defined('CUSTOMGPT_DEBUG') && CUSTOMGPT_DEBUG) {
    add_action('wp_footer', function() {
        ?>
        <script>
        window.CUSTOMGPT_DEBUG = true;
        console.log('CustomGPT Debug Mode Enabled');
        
        // Log widget events
        if (window.customGPTWidget) {
            ['open', 'close', 'message', 'error'].forEach(event => {
                window.customGPTWidget.on(event, (data) => {
                    console.log('CustomGPT Event:', event, data);
                });
            });
        }
        </script>
        <?php
    });
}
```

## Best Practices

1. **Use Child Theme**: Always make modifications in a child theme
2. **Test Updates**: Test plugin/theme updates in staging first
3. **Monitor Performance**: Use tools like Query Monitor
4. **Regular Backups**: Backup before making changes
5. **Security Headers**: Implement proper CSP headers
6. **User Privacy**: Respect GDPR and privacy regulations
7. **Mobile Testing**: Test on various devices and screen sizes
8. **Accessibility**: Ensure WCAG compliance

## Support Resources

- [WordPress Codex](https://codex.wordpress.org/)
- [Plugin Development Handbook](https://developer.wordpress.org/plugins/)
- [Theme Development Handbook](https://developer.wordpress.org/themes/)
- [CustomGPT Documentation](https://docs.customgpt.ai)
- [CustomGPT Support](https://support.customgpt.ai)