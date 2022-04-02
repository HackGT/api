import swaggerUi from "swagger-ui-express";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// eslint-disable-next-line import/no-relative-packages
import config from "../../config/src/index";

// eslint-disable-next-line import/extensions
import swaggerFile from "./swagger-output.json";
import { swaggerOptions } from "./swagger";

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(compression());
app.use(cors());
app.use(express.json());

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
  throw err;
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, swaggerOptions));

app.listen(config.docs.port, () => {
  console.log(`DOCS started on port ${config.docs.port}`);
});
