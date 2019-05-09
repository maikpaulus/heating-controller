enum HeatingMode {
  'manual',
  'auto'
}

export class HeatingDevice {
  /** unique mac address */
  private macAddress: string = undefined;

  /** current mode of the heating (manual|auto) */
  private mode: HeatingMode;

  /** current temperature */
  private temperature: number;

  /** general constructor */
  public constructor(macAddress: string) {
    this.macAddress = macAddress;
  }

  public getMacAddress(): string {
    return this.macAddress;
  }

  public setMode(mode: HeatingMode): void {
    this.mode = mode;
  }

  public getMode(): HeatingMode {
    return this.mode;
  }

  public setTemperature(temperature: number): void {
    this.temperature = temperature;
  }

  public getTemperature(): number {
    return this.temperature;
  }
};

/**
 * command interface based on a eq3 control script
 * https://github.com/Heckie75/eQ-3-radiator-thermostat
 * 
 */
export class Eq3CommandFactory {
  /**
   * creates a simple command to execute the script
   * @param type
   * @param command
   */
  public static createCommand(type: string, cmd: string, parameters: any[]): Eq3Command {
    switch (type) {
      case CommandTypes.SYNC:
        return new SyncCommand(syncCommands, cmd); 
       
      case CommandTypes.MODE:
        return new ModeCommand(modeCommands, cmd);

      case CommandTypes.TEMPERATURE:
        return new TemperatureCommand(temperatureCommands, cmd, parameters);

      case CommandTypes.TIMERS:
        return new TimersCommand(timersCommands, cmd, parameters);
      
      case CommandTypes.CONFIGURATION:
        return new ConfigurationCommand(configurationCommands, cmd, parameters);

      case CommandTypes.OTHERS:
        return new OthersCommand(othersCommands, cmd);

      default:
        throw new Error(`Your given type ${type} is not implemented yet.`);
    }
  };

  /**
   * returns a execution-ready statement for the third party eq3 script
   * @param base location where the excecutable is situated on the machine
   * @param command given command to build the executable command for the device
   * @param device heating device to control
   */
  public static getExecutable(base: string, command: Eq3Command, device: HeatingDevice): string {
    return [ base, device.getMacAddress(), command.getCommand()]
      .concat(command.getParameters())
      .join(' ');
  }
}

/**
 * base class for a general eq3 command, has to be implemented
 */ 
abstract class Eq3Command {
  /** key command */
  protected command: string;

  /**
   * @override
   */
  protected allowedCommands: string[];

  /** command parameters (optional) */
  protected parameters: any[] = [];

  public constructor(allowedCommands: string[], command: string, parameters?: any[]) {
    // hack due to typescript design
    this.allowedCommands = allowedCommands;
    if (!command || (-1 === this.allowedCommands.indexOf(command))) {
      throw new Error('You have to use a valid command here.');
    }
    
    this.setCommand(command);
    
    if (parameters && Array.isArray(parameters)) {
      this.setParameters(parameters);
    }
  }

  getCommand(): string {
    return this.command;
  }

  setCommand(command: string): void {
    this.command = command;
  }

  getParameters(): string[] {
    return this.parameters;
  }

  setParameters(parameters: any[]) {
    this.parameters = parameters;
  }
}

enum CommandTypes {
  SYNC = 'sync',
  MODE = 'mode',
  TEMPERATURE = 'temperature',
  TIMERS = 'timers',
  CONFIGURATION = 'configuration',
  OTHERS = 'others'
}

enum WeekDays {
  MONDAY = 'mon',
  TUESDAY = 'tue',
  WEDNESDAY = 'wed',
  THURSDAY = 'thu',
  FRIDAY = 'fri',
  SATURDAY = 'sat',
  SUNDAY = 'sun'
}
const weekDays = [
  WeekDays.MONDAY, WeekDays.TUESDAY, WeekDays.WEDNESDAY, 
  WeekDays.THURSDAY, WeekDays.FRIDAY, WeekDays.SATURDAY, WeekDays.SUNDAY
]

enum SyncCommands {
  SYNC = 'sync'
}

const syncCommands = [ SyncCommands.SYNC ]

/**
 * sync time and print current mode and target temperature
 */
export class SyncCommand extends Eq3Command {}


enum ModeCommands {
  AUTO = 'auto',
  MANUAL = 'manual'
}
const modeCommands = [ ModeCommands.AUTO, ModeCommands.MANUAL ]
/**
 * sets device mode to either manual or auto
 */
export class ModeCommand extends Eq3Command {}

enum TemperatureCommands {
  COMFORT = 'comfort',
  ECO = 'eco',
  BOOST = 'boost',
  BOOST_OFF = 'boost off',
  TEMP = 'temp',
  ON = 'on',
  OFF = 'off'
};

const temperatureCommands = [
  TemperatureCommands.COMFORT, TemperatureCommands.ECO, TemperatureCommands.BOOST,
  TemperatureCommands.BOOST_OFF, TemperatureCommands.TEMP, TemperatureCommands.ON,
  TemperatureCommands.OFF
];

/**
 * sets device mode to either manual or auto
 */
export class TemperatureCommand extends Eq3Command {
  protected allowedCommands:string[] = temperatureCommands;

  public constructor(allowedParams: string[], command: string, parameters?: any[]) {
    super(allowedParams, command, parameters);

    if (TemperatureCommands.TEMP === this.command && 1 !== this.parameters.length) {
      throw new Error('This command expects exactly 1 parameter.');
    }
  }
};

enum TimersCommands {
  TIMERS = 'timers',
  TIMER_SETTINGS = 'timer-settings',
  TIMER = 'timer',
  VACATION = 'vacation'
};

const timersCommands = [ 
  TimersCommands.TIMERS, TimersCommands.TIMER_SETTINGS, TimersCommands.TIMER,
  TimersCommands.VACATION
];

/**
 * sets device mode to either manual or auto
 */
export class TimersCommand extends Eq3Command {
  protected allowedCommands:string[] = timersCommands;

  public constructor(allowedParams: string[], command: string, parameters?: any[]) {
    super(allowedParams, command, parameters);

    if (TimersCommands.TIMER === this.command && 1 > this.parameters.length) {
      throw new Error('This command expects at least 1 parameter.');
    }

    if (TimersCommands.TIMER === this.command && (-1 === weekDays.indexOf(this.parameters[0]))) {
      throw new Error('The first parameter must be a valid weekday');
    }
  }
};

enum ConfigurationCommands {
  COMFORTECO = 'comforteco',
  WINDOW = 'window',
  OFFSET = 'offset'
};

const configurationCommands = [
  ConfigurationCommands.COMFORTECO, ConfigurationCommands.WINDOW, ConfigurationCommands.OFFSET
];

/**
 * sets device mode to either manual or auto
 */
export class ConfigurationCommand extends Eq3Command {
  protected allowedCommands:string[] = configurationCommands;
};

enum OthersCommands {
  LOCK = 'lock',
  UNLOCK = 'unlock',
  SERIAL = 'serial',
  STATUS = 'status',
  JSON = 'json',
  CLEAR = 'clear',
  RESET = 'reset'
};

const othersCommands = [ 
  OthersCommands.LOCK, OthersCommands.UNLOCK, OthersCommands.SERIAL, OthersCommands.STATUS,
  OthersCommands.JSON, OthersCommands.CLEAR, OthersCommands.RESET
];

/**
 * simply prints status information of the heating device
 * optionally in json format
 */
export class OthersCommand extends Eq3Command {
};