import express from "express";
import {generate} from "./genController";

const router = express.Router()

router.post('/db', generate)

//router.post('/json', generateJSON)

//router.post('/csv', generateCSV)

//router.post('/xml', generateXML)


export default router;