import { DataSource, DataSourceOptions } from "typeorm";
import { ormConfig } from "./orm.config";

export default new DataSource(ormConfig as DataSourceOptions);
