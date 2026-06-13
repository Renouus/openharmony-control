function resolveSymbolResource(name: string): Resource {
  switch (name) {
    case 'home':
      return $r('sys.symbol.house');
    case 'auto_awesome':
      return $r('sys.symbol.star');
    case 'notifications':
      return $r('sys.symbol.bell_fill');
    case 'notifications_off':
      return $r('sys.symbol.bell_slash');
    case 'group':
      return $r('sys.symbol.person_2');
    case 'settings':
      return $r('sys.symbol.gearshape');
    case 'arrow_back':
      return $r('sys.symbol.arrow_left');
    case 'refresh':
      return $r('sys.symbol.arrow_clockwise');
    case 'xmark':
      return $r('sys.symbol.xmark');
    case 'add':
      return $r('sys.symbol.plus');
    case 'edit':
      return $r('sys.symbol.square_and_pencil');
    case 'delete':
      return $r('sys.symbol.trash');
    case 'menu':
      return $r('sys.symbol.more');
    case 'lock':
      return $r('sys.symbol.lock');
    case 'lock_open':
      return $r('sys.symbol.lock_open');
    case 'schedule':
      return $r('sys.symbol.clock');
    case 'battery_horiz_075':
      return $r('sys.symbol.battery_75percent');
    case 'chevron_right':
      return $r('sys.symbol.chevron_right');
    case 'check_circle':
      return $r('sys.symbol.checkmark_circle');
    case 'more_vert':
      return $r('sys.symbol.more');
    case 'person_add':
      return $r('sys.symbol.person_badge_plus');
    case 'vpn_key':
      return $r('sys.symbol.vpn_key');
    case 'wifi':
      return $r('sys.symbol.wifi');
    case 'router':
      return $r('sys.symbol.wifi');
    case 'contact_emergency':
      return $r('sys.symbol.person_shield');
    case 'fiber_manual_record':
      return $r('sys.symbol.record_circle');
    case 'videocam':
      return $r('sys.symbol.camera');
    case 'movie':
      return $r('sys.symbol.movie_fill');
    case 'bedtime':
      return $r('sys.symbol.moon_fill');
    case 'flight_takeoff':
      return $r('sys.symbol.airplane_fill');
    case 'menu_book':
      return $r('sys.symbol.book_open_fill');
    case 'wb_sunny':
      return $r('sys.symbol.sun_max');
    case 'wb_twilight':
      return $r('sys.symbol.sun_min');
    case 'lightbulb':
      return $r('sys.symbol.lightbulb');
    case 'thermostat':
      return $r('sys.symbol.sun_max');
    case 'devices':
      return $r('sys.symbol.square_grid_2x2');
    case 'ac_unit':
      return $r('sys.symbol.snowflake');
    case 'mode_heat':
      return $r('sys.symbol.thermometer_sun_fill');
    case 'water_drop':
      return $r('sys.symbol.drop_fill');
    case 'autorenew':
      return $r('sys.symbol.arrow_clockwise');
    case 'power_settings_new':
      return $r('sys.symbol.power');
    case 'chair':
      return $r('sys.symbol.house');
    case 'restaurant':
      return $r('sys.symbol.house');
    case 'bed':
      return $r('sys.symbol.moon_fill');
    case 'bathtub':
      return $r('sys.symbol.house');
    case 'room':
      return $r('sys.symbol.house');
    case 'garage':
      return $r('sys.symbol.house');
    case 'security':
      return $r('sys.symbol.person_shield');
    case 'house':
      return $r('sys.symbol.house');
    case 'self_care':
      return $r('sys.symbol.star');
    default:
      return $r('sys.symbol.house');
  }
}

@Component
export struct AppSymbol {
  @Prop name: string;
  @Prop color: ResourceColor;
  @Prop glyphSize: number | string = 20;
  @Prop weight: number | FontWeight | string = FontWeight.Regular;

  build() {
    SymbolGlyph(resolveSymbolResource(this.name))
      .fontSize(this.glyphSize)
      .fontColor([this.color])
      .fontWeight(this.weight)
      .renderingStrategy(SymbolRenderingStrategy.SINGLE)
  }
}
