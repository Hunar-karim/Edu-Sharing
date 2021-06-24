/*
 * edu-sharing Repository REST API
 * The public restful API of the edu-sharing repository.
 *
 * OpenAPI spec version: 1.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


package io.swagger.client.model;

import java.util.Objects;
import java.util.Arrays;
import com.google.gson.TypeAdapter;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * SimpleEditOrganization
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class SimpleEditOrganization {
  @SerializedName("groupTypes")
  private List<String> groupTypes = null;

  public SimpleEditOrganization groupTypes(List<String> groupTypes) {
    this.groupTypes = groupTypes;
    return this;
  }

  public SimpleEditOrganization addGroupTypesItem(String groupTypesItem) {
    if (this.groupTypes == null) {
      this.groupTypes = new ArrayList<String>();
    }
    this.groupTypes.add(groupTypesItem);
    return this;
  }

   /**
   * Get groupTypes
   * @return groupTypes
  **/
  @ApiModelProperty(value = "")
  public List<String> getGroupTypes() {
    return groupTypes;
  }

  public void setGroupTypes(List<String> groupTypes) {
    this.groupTypes = groupTypes;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SimpleEditOrganization simpleEditOrganization = (SimpleEditOrganization) o;
    return Objects.equals(this.groupTypes, simpleEditOrganization.groupTypes);
  }

  @Override
  public int hashCode() {
    return Objects.hash(groupTypes);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SimpleEditOrganization {\n");
    
    sb.append("    groupTypes: ").append(toIndentedString(groupTypes)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }

}
