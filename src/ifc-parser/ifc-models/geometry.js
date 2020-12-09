import { newObject } from "../parser/parser-map.js";
import { namedProps as n } from "../../utils/global-constants.js";
import { ifcDataTypes as d } from "../../utils/ifc-data-types.js";
import { getName, ifcTypes as t } from "../../utils/ifc-types.js";

newObject({
  [n.ifcClass]: getName(t.IfcAxis2Placement2D),
  [n.location]: d.id,
  [n.refDirection]: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcAxis2Placement3D),
  [n.location]: d.id,
  [n.axis]: d.id,
  [n.refDirection]: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcBooleanClippingResult),
  Operator: d.enum,
  FirstOperand: d.id,
  SecondOperand: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcEllipse),
  [n.position]: d.id,
  [n.semiAxis1]: d.number,
  [n.semiAxis2]: d.number,
});

newObject({
  [n.ifcClass]: getName(t.IfcCartesianPoint),
  [n.coordinates]: d.numSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcConnectionSurfaceGeometry),
  SurfaceOnRelatingElement: d.id,
  SurfaceOnRelatedElement: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcCurveBoundedPlane),
  BasisSurface: d.id,
  OuterBoundary: d.id,
  InnerBoundaries: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcDirection),
  [n.dirRatios]: d.numSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcExtrudedAreaSolid),
  [n.sweptArea]: d.id,
  [n.position]: d.id,
  [n.extDirection]: d.id,
  [n.depth]: d.number,
});

newObject({
  [n.ifcClass]: getName(t.IfcPlane),
  Position: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcPolygonalBoundedHalfSpace),
  BaseSurface: d.id,
  AgreementFlag: d.bool,
  Position: d.id,
  PolygonalBoundary: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcPolyline),
  [n.points]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcProductDefinitionShape),
  Description: d.text,
  [n.representationType]: d.text,
  [n.representations]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcRectangleProfileDef),
  ProfileType: d.enum,
  ProfileName: d.text,
  [n.position]: d.id,
  [n.xDim]: d.number,
  [n.yDim]: d.number,
});

newObject({
  [n.ifcClass]: getName(t.IfcCircleProfileDef),
  ProfileType: d.enum,
  ProfileName: d.text,
  [n.position]: d.id,
  [n.radius]: d.number,
});

newObject({
  [n.ifcClass]: getName(t.IfcArbitraryProfileDefWithVoids),
  ProfileType: d.enum,
  ProfileName: d.text,
  [n.outerCurve]: d.id,
  [n.innerCurves]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcArbitraryClosedProfileDef),
  ProfileType: d.enum,
  ProfileName: d.text,
  [n.outerCurve]: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcShapeRepresentation),
  ContextOfItems: d.id,
  RepresentationIdentifier: d.text,
  [n.representationType]: d.text,
  [n.items]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcFaceOuterBound),
  [n.bound]: d.id,
  [n.orientation]: d.bool,
});

newObject({
  [n.ifcClass]: getName(t.IfcFaceBound),
  [n.bound]: d.id,
  [n.orientation]: d.bool,
});

newObject({
  [n.ifcClass]: getName(t.IfcFace),
  [n.bounds]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcPolyLoop),
  [n.polygon]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcClosedShell),
  [n.cfsFaces]: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcFacetedBrep),
  [n.outer]: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcCartesianTransformationOperator3D),
  [n.axis1]: d.id,
  [n.axis2]: d.id,
  [n.localOrigin]: d.id,
  [n.scale]: d.number,
  [n.axis3]: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcGeometricCurveSet),
  Elements: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcConnectedFaceSet),
  CfsFaces: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcFaceBasedSurfaceModel),
  FbsmFaces: d.idSet,
});

newObject({
  [n.ifcClass]: getName(t.IfcHalfSpaceSolid),
  BaseSurface: d.id,
  AgreementFlag: d.bool,
});

newObject({
  [n.ifcClass]: getName(t.IfcCompositeCurveSegment),
  Transition: d.enum,
  SameSense: d.bool,
  ParentCurve: d.id,
});

newObject({
  [n.ifcClass]: getName(t.IfcCircle),
  Position: d.id,
  Radius: d.number,
});

newObject({
  [n.ifcClass]: getName(t.IfcTrimmedCurve),
  BasisCurve: d.id,
  Trim1: d.valueSet,
  Trim2: d.valueSet,
  SenseAgreement: d.bool,
  MasterRepresentation: d.enum,
});

newObject({
  [n.ifcClass]: getName(t.IfcCompositeCurve),
  Segments: d.idSet,
  SelfIntersect: d.bool,
});
