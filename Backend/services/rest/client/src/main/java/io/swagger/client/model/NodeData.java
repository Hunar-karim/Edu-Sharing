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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * NodeData
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class NodeData {
  @SerializedName("timestamp")
  private String timestamp = null;

  @SerializedName("counts")
  private Map<String, Integer> counts = null;

  public NodeData timestamp(String timestamp) {
    this.timestamp = timestamp;
    return this;
  }

   /**
   * Get timestamp
   * @return timestamp
  **/
  @ApiModelProperty(value = "")
  public String getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(String timestamp) {
    this.timestamp = timestamp;
  }

  public NodeData counts(Map<String, Integer> counts) {
    this.counts = counts;
    return this;
  }

  public NodeData putCountsItem(String key, Integer countsItem) {
    if (this.counts == null) {
      this.counts = new HashMap<String, Integer>();
    }
    this.counts.put(key, countsItem);
    return this;
  }

   /**
   * Get counts
   * @return counts
  **/
  @ApiModelProperty(value = "")
  public Map<String, Integer> getCounts() {
    return counts;
  }

  public void setCounts(Map<String, Integer> counts) {
    this.counts = counts;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    NodeData nodeData = (NodeData) o;
    return Objects.equals(this.timestamp, nodeData.timestamp) &&
        Objects.equals(this.counts, nodeData.counts);
  }

  @Override
  public int hashCode() {
    return Objects.hash(timestamp, counts);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class NodeData {\n");
    
    sb.append("    timestamp: ").append(toIndentedString(timestamp)).append("\n");
    sb.append("    counts: ").append(toIndentedString(counts)).append("\n");
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
